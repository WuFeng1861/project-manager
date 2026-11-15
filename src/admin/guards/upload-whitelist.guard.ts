import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ClientIpUtil } from '../../common/utils/client-ip.util';
import { IpBlockService } from '../../rate-limit/ip-block.service';
import { IpWhitelistService } from '../ip-whitelist.service';

/**
 * 项目信息上报白名单守卫（用于 POST /projects）
 *
 * 规则：
 * - 来源 IP 在白名单内 -> 放行；
 * - 已处于黑名单 -> 直接拒绝；
 * - 不在白名单 -> 拦截本次上报，并把该 IP 写入黑名单，原因记为「非项目成员」。
 *
 * 可通过 UPLOAD_WHITELIST_ENFORCE=false 临时关闭（灰度/排障时使用）。
 */
@Injectable()
export class UploadWhitelistGuard implements CanActivate {
  private readonly logger = new Logger(UploadWhitelistGuard.name);
  private readonly enforce: boolean;
  private readonly blockMs: number;

  constructor(
    private readonly whitelistService: IpWhitelistService,
    private readonly ipBlockService: IpBlockService,
    configService: ConfigService,
  ) {
    this.enforce =
      String(configService.get('UPLOAD_WHITELIST_ENFORCE', 'true')) !== 'false';
    this.blockMs = Number(
      configService.get('UPLOAD_BLOCK_MS', 30 * 24 * 60 * 60 * 1000),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.enforce) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const ip = ClientIpUtil.getTrustedClientIp(request);

    if (!ip) {
      throw new ForbiddenException('无法识别上报来源 IP，已拒绝上报');
    }

    const activeBlock = this.ipBlockService.getActiveBlock(ip);
    if (activeBlock) {
      throw new ForbiddenException(
        `IP ${ip} 已被列入黑名单（原因：${activeBlock.reason || '未标注'}），拒绝上报`,
      );
    }

    if (this.whitelistService.isWhitelisted(ip)) {
      return true;
    }

    await this.ipBlockService.block(ip, this.blockMs, '非项目成员');
    this.logger.warn(`非白名单 IP 上报被拦截并拉黑: ${ip}`);

    throw new ForbiddenException(
      `IP ${ip} 不在项目白名单内，本次上报已拦截，并已将该 IP 加入黑名单（原因：非项目成员）`,
    );
  }
}
