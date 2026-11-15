import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IpWhitelist } from './entities/ip-whitelist.entity';
import { Project } from '../projects/entities/project.entity';
import { IpBlockService } from '../rate-limit/ip-block.service';
export declare class IpWhitelistService implements OnModuleInit {
    private readonly whitelistRepository;
    private readonly projectRepository;
    private readonly ipBlockService;
    private readonly logger;
    private readonly cache;
    constructor(whitelistRepository: Repository<IpWhitelist>, projectRepository: Repository<Project>, ipBlockService: IpBlockService);
    onModuleInit(): Promise<void>;
    isWhitelisted(ip: string): boolean;
    list(): Promise<IpWhitelist[]>;
    add(ip: string, note: string | undefined, createdBy: string): Promise<{
        entry: IpWhitelist;
        created: boolean;
        unblocked: boolean;
    }>;
    remove(ip: string): Promise<{
        success: boolean;
        message: string;
    }>;
    normalizeIp(ip: string): string;
    private reloadCache;
    private seed;
}
export declare function isPrivateIp(ip: string): boolean;
