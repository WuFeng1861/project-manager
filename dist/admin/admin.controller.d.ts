import { Request as ExpressRequest } from 'express';
import { AdminService } from './admin.service';
import { IpWhitelistService } from './ip-whitelist.service';
import { IpBlockService } from '../rate-limit/ip-block.service';
import { AddWhitelistDto, BlockIpDto, ChangeCredentialsDto, LoginDto, SetupAdminDto } from './dto/admin.dto';
export declare class AdminController {
    private readonly adminService;
    private readonly whitelistService;
    private readonly ipBlockService;
    constructor(adminService: AdminService, whitelistService: IpWhitelistService, ipBlockService: IpBlockService);
    status(): Promise<{
        initialized: boolean;
    }>;
    setup(dto: SetupAdminDto, request: ExpressRequest): Promise<import("./admin.service").AuthResult>;
    login(dto: LoginDto, request: ExpressRequest): Promise<import("./admin.service").AuthResult>;
    logout(request: ExpressRequest): Promise<{
        success: boolean;
        message: string;
    }>;
    profile(): Promise<{
        username: string;
        createdAt: Date;
        passwordUpdatedAt: Date;
    }>;
    changeCredentials(dto: ChangeCredentialsDto, request: ExpressRequest): Promise<{
        username: string;
        changedUsername: boolean;
        changedPassword: boolean;
        revokedSessions: number;
    }>;
    listBlockedIps(): Promise<import("../rate-limit/entities/blocked-ip.entity").BlockedIp[]>;
    blockIp(dto: BlockIpDto): Promise<{
        success: boolean;
        message: string;
        ip: string;
        blockedUntil: Date;
    }>;
    unblockIp(ip: string): Promise<{
        success: boolean;
        message: string;
    }>;
    listWhitelist(): Promise<import("./entities/ip-whitelist.entity").IpWhitelist[]>;
    addWhitelist(dto: AddWhitelistDto, request: ExpressRequest): Promise<{
        success: boolean;
        message: string;
        data: import("./entities/ip-whitelist.entity").IpWhitelist;
        created: boolean;
        unblocked: boolean;
    }>;
    removeWhitelist(ip: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private meta;
}
