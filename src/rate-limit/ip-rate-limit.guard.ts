import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ClientIpUtil } from '../common/utils/client-ip.util';
import { IpBlockService } from './ip-block.service';

@Injectable()
export class IpRateLimitGuard implements CanActivate {
  private readonly windowMs: number;
  private readonly hardLimit: number;
  private readonly blockMs: number;
  private readonly adminPassword: string;

  constructor(
    private readonly ipBlockService: IpBlockService,
    configService: ConfigService,
  ) {
    this.windowMs = Number(configService.get('RATE_LIMIT_WINDOW_MS', 60_000));
    const normalMax = Number(configService.get('RATE_LIMIT_NORMAL_MAX', 30));
    const multiplier = Number(
      configService.get('RATE_LIMIT_BLACKLIST_MULTIPLIER', 10),
    );
    this.hardLimit = normalMax * multiplier;
    this.blockMs = Number(
      configService.get('RATE_LIMIT_BLOCK_MS', 24 * 60 * 60 * 1000),
    );
    this.adminPassword = configService.get('SERVER_PASSWORD');

    const timer = setInterval(
      () => this.ipBlockService.pruneCounters(this.windowMs),
      5 * 60 * 1000,
    );
    timer.unref?.();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.method === 'OPTIONS' || request.path.startsWith('/api')) {
      return true;
    }

    // 管理员请求不参与限流，避免管理员被自己的黑名单挡住
    const adminPassword =
      request.headers['admin-password'] || request.query.adminPassword;
    if (this.adminPassword && adminPassword === this.adminPassword) {
      return true;
    }

    const ip = ClientIpUtil.getClientIp(request) || 'unknown';

    if (this.ipBlockService.isBlocked(ip)) {
      throw new ForbiddenException('该 IP 已被列入黑名单');
    }

    const count = this.ipBlockService.hit(ip, this.windowMs);
    if (count > this.hardLimit) {
      await this.ipBlockService.block(
        ip,
        this.blockMs,
        `请求过于频繁：${count} 次/${this.windowMs}ms`,
      );
      throw new HttpException(
        '请求过于频繁，IP 已被列入黑名单',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
