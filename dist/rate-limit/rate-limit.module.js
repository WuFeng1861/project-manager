"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const blocked_ip_entity_1 = require("./entities/blocked-ip.entity");
const ip_block_service_1 = require("./ip-block.service");
const ip_rate_limit_guard_1 = require("./ip-rate-limit.guard");
let RateLimitModule = class RateLimitModule {
};
exports.RateLimitModule = RateLimitModule;
exports.RateLimitModule = RateLimitModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([blocked_ip_entity_1.BlockedIp])],
        providers: [
            ip_block_service_1.IpBlockService,
            {
                provide: core_1.APP_GUARD,
                useClass: ip_rate_limit_guard_1.IpRateLimitGuard,
            },
        ],
        exports: [ip_block_service_1.IpBlockService],
    })
], RateLimitModule);
//# sourceMappingURL=rate-limit.module.js.map