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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_ip_util_1 = require("../common/utils/client-ip.util");
const ip_block_service_1 = require("./ip-block.service");
let IpRateLimitGuard = class IpRateLimitGuard {
    constructor(ipBlockService, configService) {
        this.ipBlockService = ipBlockService;
        this.windowMs = Number(configService.get('RATE_LIMIT_WINDOW_MS', 60_000));
        const normalMax = Number(configService.get('RATE_LIMIT_NORMAL_MAX', 30));
        const multiplier = Number(configService.get('RATE_LIMIT_BLACKLIST_MULTIPLIER', 10));
        this.hardLimit = normalMax * multiplier;
        this.blockMs = Number(configService.get('RATE_LIMIT_BLOCK_MS', 24 * 60 * 60 * 1000));
        this.adminPassword = configService.get('SERVER_PASSWORD');
        const timer = setInterval(() => this.ipBlockService.pruneCounters(this.windowMs), 5 * 60 * 1000);
        timer.unref?.();
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (request.method === 'OPTIONS' || request.path.startsWith('/api')) {
            return true;
        }
        const adminPassword = request.headers['admin-password'] || request.query.adminPassword;
        if (this.adminPassword && adminPassword === this.adminPassword) {
            return true;
        }
        const ip = client_ip_util_1.ClientIpUtil.getClientIp(request) || 'unknown';
        if (this.ipBlockService.isBlocked(ip)) {
            throw new common_1.ForbiddenException('该 IP 已被列入黑名单');
        }
        const count = this.ipBlockService.hit(ip, this.windowMs);
        if (count > this.hardLimit) {
            await this.ipBlockService.block(ip, this.blockMs, `请求过于频繁：${count} 次/${this.windowMs}ms`);
            throw new common_1.HttpException('请求过于频繁，IP 已被列入黑名单', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
};
exports.IpRateLimitGuard = IpRateLimitGuard;
exports.IpRateLimitGuard = IpRateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ip_block_service_1.IpBlockService,
        config_1.ConfigService])
], IpRateLimitGuard);
//# sourceMappingURL=ip-rate-limit.guard.js.map