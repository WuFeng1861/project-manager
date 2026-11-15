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
import { AdminService } from '../admin/admin.service';

@Injectable()
export class IpRateLimitGuard implements CanActivate {
  private readonly windowMs: number;
  private readonly hardLimit: number;
  private readonly blockMs: number;

  constructor(
    private readonly ipBlockService: IpBlockService,
    private readonly adminService: AdminService,
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

    // 携带有效管理员令牌的请求不参与限流与黑名单判定
    const token = AdminService.extractToken(request);
    if (token && (await this.adminService.validateSession(token))) {
      return true;
    }

    const ip = ClientIpUtil.getTrustedClientIp(request) || 'unknown';

    // 管理端接口不因黑名单被挡：否则管理员 IP 一旦被拉黑就再也进不了后台，
    // 无法把自己加回白名单（这些接口本身仍有令牌 + 登录失败锁定保护）。
    const isAdminPath =
      request.path === '/admin' || request.path.startsWith('/admin/');

    if (!isAdminPath) {
      const activeBlock = this.ipBlockService.getActiveBlock(ip);
      if (activeBlock) {
        throw new ForbiddenException(
          `该 IP 已被列入黑名单（原因：${activeBlock.reason || '未标注'}）`,
        );
      }
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
