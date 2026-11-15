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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const ip_whitelist_service_1 = require("./ip-whitelist.service");
const ip_block_service_1 = require("../rate-limit/ip-block.service");
const admin_token_guard_1 = require("./guards/admin-token.guard");
const client_ip_util_1 = require("../common/utils/client-ip.util");
const admin_dto_1 = require("./dto/admin.dto");
let AdminController = class AdminController {
    constructor(adminService, whitelistService, ipBlockService) {
        this.adminService = adminService;
        this.whitelistService = whitelistService;
        this.ipBlockService = ipBlockService;
    }
    async status() {
        return this.adminService.getStatus();
    }
    async setup(dto, request) {
        return this.adminService.setup(dto.username, dto.password, this.meta(request));
    }
    async login(dto, request) {
        return this.adminService.login(dto.username, dto.password, this.meta(request));
    }
    async logout(request) {
        const token = admin_service_1.AdminService.extractToken(request);
        return this.adminService.logout(token);
    }
    async profile() {
        return this.adminService.getProfile();
    }
    async changeCredentials(dto, request) {
        const admin = request.admin;
        return this.adminService.changeCredentials(admin.sessionId, dto.currentPassword, dto.username, dto.newPassword);
    }
    async listBlockedIps() {
        return this.ipBlockService.list();
    }
    async blockIp(dto) {
        const ip = this.whitelistService.normalizeIp(dto.ip);
        if (!ip) {
            throw new common_1.BadRequestException('IP 格式不正确');
        }
        if (this.whitelistService.isWhitelisted(ip)) {
            throw new common_1.BadRequestException(`IP ${ip} 当前在白名单中，请先将其移出白名单再拉黑`);
        }
        const defaultMs = Number(process.env.RATE_LIMIT_BLOCK_MS) || 24 * 60 * 60 * 1000;
        const hours = Number(dto.durationHours);
        const durationMs = hours > 0 ? hours * 60 * 60 * 1000 : defaultMs;
        await this.ipBlockService.block(ip, durationMs, dto.reason?.trim() || '管理员手动加入黑名单');
        return {
            success: true,
            message: `已将 ${ip} 加入黑名单`,
            ip,
            blockedUntil: new Date(Date.now() + durationMs),
        };
    }
    async unblockIp(ip) {
        const normalized = this.whitelistService.normalizeIp(ip);
        if (!normalized) {
            throw new common_1.BadRequestException('IP 格式不正确');
        }
        return this.ipBlockService.unblock(normalized);
    }
    async listWhitelist() {
        return this.whitelistService.list();
    }
    async addWhitelist(dto, request) {
        const admin = request.admin;
        try {
            const result = await this.whitelistService.add(dto.ip, dto.note, admin?.username || 'admin');
            return {
                success: true,
                message: result.unblocked
                    ? `${result.entry.ip} 已加入白名单，并已解除黑名单`
                    : `${result.entry.ip} 已加入白名单`,
                data: result.entry,
                created: result.created,
                unblocked: result.unblocked,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message || '加入白名单失败');
        }
    }
    async removeWhitelist(ip) {
        const normalized = this.whitelistService.normalizeIp(ip);
        if (!normalized) {
            throw new common_1.BadRequestException('IP 格式不正确');
        }
        return this.whitelistService.remove(normalized);
    }
    meta(request) {
        return {
            ip: client_ip_util_1.ClientIpUtil.getTrustedClientIp(request) || 'unknown',
            userAgent: String(request.headers['user-agent'] || ''),
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: '查询管理员账号是否已初始化（前端判断是否弹首次设置）' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('setup'),
    (0, swagger_1.ApiOperation)({ summary: '首次设置管理员账号密码（仅未初始化时可用）' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '初始化成功并直接登录' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.SetupAdminDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "setup", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: '管理员账号 + 密码登录' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '登录成功，返回令牌' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(admin_token_guard_1.AdminTokenGuard),
    (0, swagger_1.ApiOperation)({ summary: '退出登录（销毁当前会话）' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(admin_token_guard_1.AdminTokenGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取当前登录管理员信息' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "profile", null);
__decorate([
    (0, common_1.Put)('credentials'),
    (0, common_1.UseGuards)(admin_token_guard_1.AdminTokenGuard),
    (0, swagger_1.ApiOperation)({ summary: '修改管理员账号/密码（需当前密码确认）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '修改成功' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.ChangeCredentialsDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changeCredentials", null);
__decorate([
    (0, common_1.Get)('blocked-ips'),
    (0, common_1.UseGuards)(admin_token_guard_1.AdminTokenGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取黑名单 IP 列表' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listBlockedIps", null);
__decorate([
    (0, common_1.Post)('blocked-ips'),
    (0, common_1.UseGuards)(admin_token_guard_1.AdminTokenGuard),
    (0, swagger_1.ApiOperation)({ summary: '手动将 IP 加入黑名单' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.BlockIpDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "blockIp", null);
__decorate([
    (0, common_1.Delete)('blocked-ips/:ip'),
    (0, common_1.UseGuards)(admin_token_guard_1.AdminTokenGuard),
    (0, swagger_1.ApiOperation)({ summary: '解除指定 IP 的黑名单' }),
    __param(0, (0, common_1.Param)('ip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unblockIp", null);
__decorate([
    (0, common_1.Get)('whitelist'),
    (0, common_1.UseGuards)(admin_token_guard_1.AdminTokenGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取上报 IP 白名单' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listWhitelist", null);
__decorate([
    (0, common_1.Post)('whitelist'),
    (0, common_1.UseGuards)(admin_token_guard_1.AdminTokenGuard),
    (0, swagger_1.ApiOperation)({ summary: '将 IP 加入白名单（若在黑名单中会同时解除）' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '已加入白名单' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AddWhitelistDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addWhitelist", null);
__decorate([
    (0, common_1.Delete)('whitelist/:ip'),
    (0, common_1.UseGuards)(admin_token_guard_1.AdminTokenGuard),
    (0, swagger_1.ApiOperation)({ summary: '将 IP 移出白名单' }),
    __param(0, (0, common_1.Param)('ip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeWhitelist", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        ip_whitelist_service_1.IpWhitelistService,
        ip_block_service_1.IpBlockService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map