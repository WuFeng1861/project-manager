import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AdminService } from '../admin.service';
export declare class AdminTokenGuard implements CanActivate {
    private readonly adminService;
    constructor(adminService: AdminService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
