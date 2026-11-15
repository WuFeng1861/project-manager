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
const admin_module_1 = require("../admin/admin.module");
const ip_block_module_1 = require("./ip-block.module");
const ip_rate_limit_guard_1 = require("./ip-rate-limit.guard");
let RateLimitModule = class RateLimitModule {
};
exports.RateLimitModule = RateLimitModule;
exports.RateLimitModule = RateLimitModule = __decorate([
    (0, common_1.Module)({
        imports: [ip_block_module_1.IpBlockModule, admin_module_1.AdminModule],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: ip_rate_limit_guard_1.IpRateLimitGuard,
            },
        ],
        exports: [ip_block_module_1.IpBlockModule],
    })
], RateLimitModule);
//# sourceMappingURL=rate-limit.module.js.map