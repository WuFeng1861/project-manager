import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as process from 'process';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly ADMIN_PASSWORD = process.env.SERVER_PASSWORD;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminPassword = request.headers['admin-password'] || request.query.adminPassword;
    console.log(request.headers['admin-password'], request.query.adminPassword, 'password need:' + this.ADMIN_PASSWORD)

    if (!adminPassword || adminPassword !== this.ADMIN_PASSWORD) {
      throw new UnauthorizedException('Invalid admin password');
    }

    return true;
  }
}
