import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IpBlockService } from './ip-block.service';
import { AdminService } from '../admin/admin.service';
export declare class IpRateLimitGuard implements CanActivate {
    private readonly ipBlockService;
    private readonly adminService;
    private readonly windowMs;
    private readonly hardLimit;
    private readonly blockMs;
    constructor(ipBlockService: IpBlockService, adminService: AdminService, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
