import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from '../../admin/admin.service';

/**
 * 管理员鉴权守卫（登录态版本）
 *
 * 旧实现只比对 .env 里的 SERVER_PASSWORD，任何人拿到一个共享口令即可操作；
 * 现在改为校验管理员登录后签发的会话令牌，令牌无效/过期一律 401。
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly adminService: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = AdminService.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('未登录或登录已过期，请重新登录');
    }

    const session = await this.adminService.validateSession(token);
    if (!session) {
      throw new UnauthorizedException('未登录或登录已过期，请重新登录');
    }

    (request as any).admin = { ...session, token };
    return true;
  }
}
