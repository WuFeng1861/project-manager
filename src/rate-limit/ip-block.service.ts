import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { BlockedIp } from './entities/blocked-ip.entity';

interface RequestCounter {
  windowStart: number;
  count: number;
}

@Injectable()
export class IpBlockService implements OnModuleInit {
  private readonly blockedCache = new Map<string, number>();
  private readonly counters = new Map<string, RequestCounter>();

  constructor(
    @InjectRepository(BlockedIp)
    private readonly blockedIpRepository: Repository<BlockedIp>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.blockedIpRepository.delete({
      blockedUntil: LessThan(new Date()),
    });

    const activeBlocks = await this.blockedIpRepository.find({
      where: { blockedUntil: MoreThan(new Date()) },
    });
    for (const blocked of activeBlocks) {
      this.blockedCache.set(blocked.ip, new Date(blocked.blockedUntil).getTime());
    }
  }

  isBlocked(ip: string): boolean {
    const blockedUntil = this.blockedCache.get(ip);
    if (!blockedUntil) {
      return false;
    }
    if (blockedUntil > Date.now()) {
      return true;
    }
    this.blockedCache.delete(ip);
    return false;
  }

  hit(ip: string, windowMs: number): number {
    const now = Date.now();
    const counter = this.counters.get(ip);

    if (!counter || now - counter.windowStart >= windowMs) {
      this.counters.set(ip, { windowStart: now, count: 1 });
      return 1;
    }

    counter.count += 1;
    return counter.count;
  }

  pruneCounters(windowMs: number): void {
    const now = Date.now();
    for (const [ip, counter] of this.counters) {
      if (now - counter.windowStart >= windowMs) {
        this.counters.delete(ip);
      }
    }
  }

  async block(ip: string, durationMs: number, reason: string): Promise<void> {
    const blockedUntil = new Date(Date.now() + durationMs);
    const existing = await this.blockedIpRepository.findOne({
      where: { ip },
    });

    if (existing) {
      existing.blockedUntil = blockedUntil;
      existing.reason = reason;
      await this.blockedIpRepository.save(existing);
    } else {
      await this.blockedIpRepository.save(
        this.blockedIpRepository.create({ ip, blockedUntil, reason }),
      );
    }

    this.blockedCache.set(ip, blockedUntil.getTime());
  }

  async unblock(ip: string): Promise<{ success: boolean; message: string }> {
    await this.blockedIpRepository.delete({ ip });
    this.blockedCache.delete(ip);
    this.counters.delete(ip);

    return {
      success: true,
      message: `已解除 ${ip} 的黑名单`,
    };
  }

  async list(): Promise<BlockedIp[]> {
    return this.blockedIpRepository.find({
      where: { blockedUntil: MoreThan(new Date()) },
      order: { blockedUntil: 'DESC' },
    });
  }
}
