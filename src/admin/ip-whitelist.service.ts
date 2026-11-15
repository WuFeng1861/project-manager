import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isIP } from 'node:net';
import { IpWhitelist } from './entities/ip-whitelist.entity';
import { Project } from '../projects/entities/project.entity';
import { IpBlockService } from '../rate-limit/ip-block.service';
import { ClientIpUtil } from '../common/utils/client-ip.util';

/**
 * 上报来源 IP 白名单
 *
 * 首次启动（表为空）时会自动播种，顺序为：
 *   1. 回环地址 127.0.0.1（服务器本机自测）
 *   2. 环境变量 IP_WHITELIST 中逗号分隔的 IP
 *   3. 现有 project 表里出现过的上报来源 IP（sourceIp / sourceIps）
 *
 * 第 3 步是关键：白名单一旦开启，未在名单内的机器上报会被拦截并拉黑，
 * 若不做历史回填，线上已有项目会在上线瞬间全部失联。
 */
@Injectable()
export class IpWhitelistService implements OnModuleInit {
  private readonly logger = new Logger(IpWhitelistService.name);
  private readonly cache = new Set<string>();

  constructor(
    @InjectRepository(IpWhitelist)
    private readonly whitelistRepository: Repository<IpWhitelist>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly ipBlockService: IpBlockService,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.whitelistRepository.find();
    if (existing.length === 0) {
      await this.seed();
    } else {
      await this.reloadCache();
    }

    this.logger.log(`白名单已加载 ${this.cache.size} 个 IP`);
  }

  isWhitelisted(ip: string): boolean {
    const normalized = this.normalizeIp(ip);
    if (!normalized) {
      return false;
    }
    return this.cache.has(normalized);
  }

  async list(): Promise<IpWhitelist[]> {
    return this.whitelistRepository.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * 添加白名单。若该 IP 正处于黑名单中，会同时解除拉黑。
   * 返回值里带上 unblocked，方便前端给出"已加入白名单并解除拉黑"的提示。
   */
  async add(
    ip: string,
    note: string | undefined,
    createdBy: string,
  ): Promise<{ entry: IpWhitelist; created: boolean; unblocked: boolean }> {
    const normalized = this.normalizeIp(ip);
    if (!normalized) {
      throw new Error('IP 格式不正确');
    }

    let entry = await this.whitelistRepository.findOne({
      where: { ip: normalized },
    });

    let created = false;
    if (entry) {
      entry.enabled = 1;
      if (note !== undefined) {
        entry.note = note;
      }
      entry = await this.whitelistRepository.save(entry);
    } else {
      entry = await this.whitelistRepository.save(
        this.whitelistRepository.create({
          ip: normalized,
          note: note ?? '',
          enabled: 1,
          createdBy,
        }),
      );
      created = true;
    }

    const wasBlocked = this.ipBlockService.isBlocked(normalized);
    if (wasBlocked) {
      await this.ipBlockService.unblock(normalized);
    }

    await this.reloadCache();

    return { entry, created, unblocked: wasBlocked };
  }

  async remove(ip: string): Promise<{ success: boolean; message: string }> {    const normalized = this.normalizeIp(ip);
    const result = await this.whitelistRepository.delete({ ip: normalized });
    await this.reloadCache();

    return {
      success: (result.affected ?? 0) > 0,
      message:
        (result.affected ?? 0) > 0
          ? `已将 ${normalized} 移出白名单`
          : `${normalized} 不在白名单中`,
    };
  }

  /** 统一 IP 写法：去空白、去 IPv4 映射前缀、IPv6 回环归一 */
  normalizeIp(ip: string): string {
    const value = (ip || '')
      .trim()
      .replace(/^::ffff:/i, '')
      .replace(/^::1$/, '127.0.0.1');
    return isIP(value) ? value : '';
  }

  private async reloadCache(): Promise<void> {
    const rows = await this.whitelistRepository.find({
      where: { enabled: 1 },
    });
    this.cache.clear();
    for (const row of rows) {
      this.cache.add(row.ip);
    }
  }

  private async seed(): Promise<void> {
    const candidates = new Set<string>(['127.0.0.1']);

    const envList = (process.env.IP_WHITELIST || '')
      .split(',')
      .map((item) => this.normalizeIp(item))
      .filter(Boolean);
    envList.forEach((ip) => candidates.add(ip));

    if (process.env.WHITELIST_SEED_FROM_PROJECTS !== 'false') {
      const projects = await this.projectRepository.find();
      for (const project of projects) {
        const single = this.normalizeIp(project.sourceIp);
        if (single) {
          candidates.add(single);
        }

        for (const ip of project.sourceIps || []) {
          const normalized = this.normalizeIp(ip);
          if (normalized) {
            candidates.add(normalized);
          }
        }
      }
    }

    for (const ip of candidates) {
      await this.whitelistRepository.save(
        this.whitelistRepository.create({
          ip,
          note: '初始化自动播种',
          enabled: 1,
          createdBy: 'system',
        }),
      );
    }

    this.logger.warn(
      `白名单初始化完成，自动播种 ${candidates.size} 个 IP：${[...candidates].join(', ')}`,
    );
    await this.reloadCache();
  }
}

/** 供守卫复用：判断一个 IP 是否属于回环/内网（仅用于日志与提示文案） */
export function isPrivateIp(ip: string): boolean {
  return ClientIpUtil.isPrivateOrLoopback(ip);
}
