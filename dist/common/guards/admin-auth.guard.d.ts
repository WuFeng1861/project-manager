import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class AdminAuthGuard implements CanActivate {
    private readonly ADMIN_PASSWORD;
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
}
