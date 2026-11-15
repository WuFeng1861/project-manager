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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpBlockService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const blocked_ip_entity_1 = require("./entities/blocked-ip.entity");
let IpBlockService = class IpBlockService {
    constructor(blockedIpRepository) {
        this.blockedIpRepository = blockedIpRepository;
        this.blockedCache = new Map();
        this.counters = new Map();
    }
    async onModuleInit() {
        await this.blockedIpRepository.delete({
            blockedUntil: (0, typeorm_2.LessThan)(new Date()),
        });
        const activeBlocks = await this.blockedIpRepository.find({
            where: { blockedUntil: (0, typeorm_2.MoreThan)(new Date()) },
        });
        for (const blocked of activeBlocks) {
            this.blockedCache.set(blocked.ip, {
                blockedUntil: new Date(blocked.blockedUntil).getTime(),
                reason: blocked.reason || '',
            });
        }
    }
    isBlocked(ip) {
        return this.getActiveBlock(ip) !== null;
    }
    getActiveBlock(ip) {
        const entry = this.blockedCache.get(ip);
        if (!entry) {
            return null;
        }
        if (entry.blockedUntil > Date.now()) {
            return entry;
        }
        this.blockedCache.delete(ip);
        return null;
    }
    hit(ip, windowMs) {
        const now = Date.now();
        const counter = this.counters.get(ip);
        if (!counter || now - counter.windowStart >= windowMs) {
            this.counters.set(ip, { windowStart: now, count: 1 });
            return 1;
        }
        counter.count += 1;
        return counter.count;
    }
    pruneCounters(windowMs) {
        const now = Date.now();
        for (const [ip, counter] of this.counters) {
            if (now - counter.windowStart >= windowMs) {
                this.counters.delete(ip);
            }
        }
    }
    async block(ip, durationMs, reason) {
        const blockedUntil = new Date(Date.now() + durationMs);
        const existing = await this.blockedIpRepository.findOne({
            where: { ip },
        });
        if (existing) {
            existing.blockedUntil = blockedUntil;
            existing.reason = reason;
            await this.blockedIpRepository.save(existing);
        }
        else {
            await this.blockedIpRepository.save(this.blockedIpRepository.create({ ip, blockedUntil, reason }));
        }
        this.blockedCache.set(ip, {
            blockedUntil: blockedUntil.getTime(),
            reason,
        });
    }
    async unblock(ip) {
        await this.blockedIpRepository.delete({ ip });
        this.blockedCache.delete(ip);
        this.counters.delete(ip);
        return {
            success: true,
            message: `已解除 ${ip} 的黑名单`,
        };
    }
    async list() {
        return this.blockedIpRepository.find({
            where: { blockedUntil: (0, typeorm_2.MoreThan)(new Date()) },
            order: { blockedUntil: 'DESC' },
        });
    }
};
exports.IpBlockService = IpBlockService;
exports.IpBlockService = IpBlockService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(blocked_ip_entity_1.BlockedIp)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], IpBlockService);
//# sourceMappingURL=ip-block.service.js.map