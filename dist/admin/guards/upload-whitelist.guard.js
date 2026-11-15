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
var UploadWhitelistGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadWhitelistGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_ip_util_1 = require("../../common/utils/client-ip.util");
const ip_block_service_1 = require("../../rate-limit/ip-block.service");
const ip_whitelist_service_1 = require("../ip-whitelist.service");
let UploadWhitelistGuard = UploadWhitelistGuard_1 = class UploadWhitelistGuard {
    constructor(whitelistService, ipBlockService, configService) {
        this.whitelistService = whitelistService;
        this.ipBlockService = ipBlockService;
        this.logger = new common_1.Logger(UploadWhitelistGuard_1.name);
        this.enforce =
            String(configService.get('UPLOAD_WHITELIST_ENFORCE', 'true')) !== 'false';
        this.blockMs = Number(configService.get('UPLOAD_BLOCK_MS', 30 * 24 * 60 * 60 * 1000));
    }
    async canActivate(context) {
        if (!this.enforce) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const ip = client_ip_util_1.ClientIpUtil.getTrustedClientIp(request);
        if (!ip) {
            throw new common_1.ForbiddenException('无法识别上报来源 IP，已拒绝上报');
        }
        const activeBlock = this.ipBlockService.getActiveBlock(ip);
        if (activeBlock) {
            throw new common_1.ForbiddenException(`IP ${ip} 已被列入黑名单（原因：${activeBlock.reason || '未标注'}），拒绝上报`);
        }
        if (this.whitelistService.isWhitelisted(ip)) {
            return true;
        }
        await this.ipBlockService.block(ip, this.blockMs, '非项目成员');
        this.logger.warn(`非白名单 IP 上报被拦截并拉黑: ${ip}`);
        throw new common_1.ForbiddenException(`IP ${ip} 不在项目白名单内，本次上报已拦截，并已将该 IP 加入黑名单（原因：非项目成员）`);
    }
};
exports.UploadWhitelistGuard = UploadWhitelistGuard;
exports.UploadWhitelistGuard = UploadWhitelistGuard = UploadWhitelistGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ip_whitelist_service_1.IpWhitelistService,
        ip_block_service_1.IpBlockService,
        config_1.ConfigService])
], UploadWhitelistGuard);
//# sourceMappingURL=upload-whitelist.guard.js.map