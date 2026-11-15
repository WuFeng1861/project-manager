import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from '../admin.service';

/**
 * 管理员会话守卫：要求请求头携带有效的 Bearer 令牌
 * 校验通过后把 session 挂到 request.admin 上供业务使用。
 */
@Injectable()
export class AdminTokenGuard implements CanActivate {
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
