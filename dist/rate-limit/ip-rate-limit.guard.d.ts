import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IpBlockService } from './ip-block.service';
export declare class IpRateLimitGuard implements CanActivate {
    private readonly ipBlockService;
    private readonly windowMs;
    private readonly hardLimit;
    private readonly blockMs;
    private readonly adminPassword;
    constructor(ipBlockService: IpBlockService, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
