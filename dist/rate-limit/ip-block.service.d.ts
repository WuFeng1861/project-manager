import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BlockedIp } from './entities/blocked-ip.entity';
export declare class IpBlockService implements OnModuleInit {
    private readonly blockedIpRepository;
    private readonly blockedCache;
    private readonly counters;
    constructor(blockedIpRepository: Repository<BlockedIp>);
    onModuleInit(): Promise<void>;
    isBlocked(ip: string): boolean;
    hit(ip: string, windowMs: number): number;
    pruneCounters(windowMs: number): void;
    block(ip: string, durationMs: number, reason: string): Promise<void>;
    unblock(ip: string): Promise<{
        success: boolean;
        message: string;
    }>;
    list(): Promise<BlockedIp[]>;
}
