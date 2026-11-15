"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var IpWhitelistService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpWhitelistService = void 0;
exports.isPrivateIp = isPrivateIp;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const node_net_1 = require("node:net");
const ip_whitelist_entity_1 = require("./entities/ip-whitelist.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const ip_block_service_1 = require("../rate-limit/ip-block.service");
const client_ip_util_1 = require("../common/utils/client-ip.util");
let IpWhitelistService = IpWhitelistService_1 = class IpWhitelistService {
    constructor(whitelistRepository, projectRepository, ipBlockService) {
        this.whitelistRepository = whitelistRepository;
        this.projectRepository = projectRepository;
        this.ipBlockService = ipBlockService;
        this.logger = new common_1.Logger(IpWhitelistService_1.name);
        this.cache = new Set();
    }
    async onModuleInit() {
        const existing = await this.whitelistRepository.find();
        if (existing.length === 0) {
            await this.seed();
        }
        else {
            await this.reloadCache();
        }
        this.logger.log(`白名单已加载 ${this.cache.size} 个 IP`);
    }
    isWhitelisted(ip) {
        const normalized = this.normalizeIp(ip);
        if (!normalized) {
            return false;
        }
        return this.cache.has(normalized);
    }
    async list() {
        return this.whitelistRepository.find({ order: { createdAt: 'DESC' } });
    }
    async add(ip, note, createdBy) {
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
        }
        else {
            entry = await this.whitelistRepository.save(this.whitelistRepository.create({
                ip: normalized,
                note: note ?? '',
                enabled: 1,
                createdBy,
            }));
            created = true;
        }
        const wasBlocked = this.ipBlockService.isBlocked(normalized);
        if (wasBlocked) {
            await this.ipBlockService.unblock(normalized);
        }
        await this.reloadCache();
        return { entry, created, unblocked: wasBlocked };
    }
    async remove(ip) {
        const normalized = this.normalizeIp(ip);
        const result = await this.whitelistRepository.delete({ ip: normalized });
        await this.reloadCache();
        return {
            success: (result.affected ?? 0) > 0,
            message: (result.affected ?? 0) > 0
                ? `已将 ${normalized} 移出白名单`
                : `${normalized} 不在白名单中`,
        };
    }
    normalizeIp(ip) {
        const value = (ip || '')
            .trim()
            .replace(/^::ffff:/i, '')
            .replace(/^::1$/, '127.0.0.1');
        return (0, node_net_1.isIP)(value) ? value : '';
    }
    async reloadCache() {
        const rows = await this.whitelistRepository.find({
            where: { enabled: 1 },
        });
        this.cache.clear();
        for (const row of rows) {
            this.cache.add(row.ip);
        }
    }
    async seed() {
        const candidates = new Set(['127.0.0.1']);
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
            await this.whitelistRepository.save(this.whitelistRepository.create({
                ip,
                note: '初始化自动播种',
                enabled: 1,
                createdBy: 'system',
            }));
        }
        this.logger.warn(`白名单初始化完成，自动播种 ${candidates.size} 个 IP：${[...candidates].join(', ')}`);
        await this.reloadCache();
    }
};
exports.IpWhitelistService = IpWhitelistService;
exports.IpWhitelistService = IpWhitelistService = IpWhitelistService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ip_whitelist_entity_1.IpWhitelist)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        ip_block_service_1.IpBlockService])
], IpWhitelistService);
function isPrivateIp(ip) {
    return client_ip_util_1.ClientIpUtil.isPrivateOrLoopback(ip);
}
//# sourceMappingURL=ip-whitelist.service.js.map