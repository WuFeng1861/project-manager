import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IpBlockService } from '../../rate-limit/ip-block.service';
import { IpWhitelistService } from '../ip-whitelist.service';
export declare class UploadWhitelistGuard implements CanActivate {
    private readonly whitelistService;
    private readonly ipBlockService;
    private readonly logger;
    private readonly enforce;
    private readonly blockMs;
    constructor(whitelistService: IpWhitelistService, ipBlockService: IpBlockService, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
