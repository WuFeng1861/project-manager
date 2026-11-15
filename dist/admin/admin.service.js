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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const node_crypto_1 = require("node:crypto");
const admin_credential_entity_1 = require("./entities/admin-credential.entity");
const admin_session_entity_1 = require("./entities/admin-session.entity");
const password_util_1 = require("../common/utils/password.util");
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const LOGIN_FAIL_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_FAIL_LIMIT = 8;
const LOGIN_LOCK_MS = 10 * 60 * 1000;
let AdminService = AdminService_1 = class AdminService {
    constructor(credentialRepository, sessionRepository) {
        this.credentialRepository = credentialRepository;
        this.sessionRepository = sessionRepository;
        this.logger = new common_1.Logger(AdminService_1.name);
        this.failures = new Map();
        this.sessionTtlMs = Number(process.env.ADMIN_SESSION_TTL_HOURS || 168) * 60 * 60 * 1000;
    }
    async onModuleInit() {
        const removed = await this.sessionRepository.delete({
            expiresAt: (0, typeorm_2.LessThan)(new Date()),
        });
        if (removed.affected) {
            this.logger.log(`清理过期管理员会话 ${removed.affected} 条`);
        }
    }
    async getStatus() {
        const credential = await this.findCredential();
        return { initialized: !!credential };
    }
    async setup(username, password, meta) {
        this.assertSetupAllowed(meta.ip);
        const existing = await this.findCredential();
        if (existing) {
            throw new common_1.ConflictException('管理员账号已初始化，请直接登录');
        }
        const safeUsername = this.validateUsername(username);
        this.validatePassword(password);
        const credential = this.credentialRepository.create({
            id: 1,
            username: safeUsername,
            passwordHash: password_util_1.PasswordUtil.hash(password),
            passwordUpdatedAt: new Date(),
        });
        try {
            await this.credentialRepository.save(credential);
        }
        catch (error) {
            this.logger.warn(`管理员初始化冲突: ${error.message}`);
            throw new common_1.ConflictException('管理员账号已初始化，请直接登录');
        }
        this.logger.warn(`管理员账号已初始化: ${safeUsername} (from ${meta.ip})`);
        return this.createSession(credential, meta);
    }
    async login(username, password, meta) {
        this.assertLoginAllowed(meta.ip);
        const credential = await this.findCredential();
        if (!credential) {
            throw new common_1.ConflictException('管理员账号尚未初始化');
        }
        const passwordOk = password_util_1.PasswordUtil.verify(String(password ?? ''), credential.passwordHash);
        const usernameOk = credential.username.toLowerCase() === String(username ?? '').trim().toLowerCase();
        if (!usernameOk || !passwordOk) {
            this.recordFailure(meta.ip);
            throw new common_1.UnauthorizedException('账号或密码错误');
        }
        this.failures.delete(meta.ip);
        return this.createSession(credential, meta);
    }
    async validateSession(token) {
        if (!token) {
            return null;
        }
        const session = await this.sessionRepository.findOne({
            where: { tokenHash: this.hashToken(token) },
        });
        if (!session) {
            return null;
        }
        if (new Date(session.expiresAt).getTime() <= Date.now()) {
            await this.sessionRepository.delete({ id: session.id });
            return null;
        }
        const credential = await this.findCredential();
        if (!credential) {
            return null;
        }
        const lastSeen = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
        if (Date.now() - lastSeen > 5 * 60 * 1000) {
            await this.sessionRepository.update({ id: session.id }, { lastSeenAt: new Date() });
        }
        return { sessionId: session.id, username: credential.username };
    }
    async logout(token) {
        if (token) {
            await this.sessionRepository.delete({ tokenHash: this.hashToken(token) });
        }
        return { success: true, message: '已退出登录' };
    }
    async getProfile() {
        const credential = await this.findCredential();
        if (!credential) {
            throw new common_1.NotFoundException('管理员账号尚未初始化');
        }
        return {
            username: credential.username,
            createdAt: credential.createdAt,
            passwordUpdatedAt: credential.passwordUpdatedAt,
        };
    }
    async changeCredentials(sessionId, currentPassword, newUsername, newPassword) {
        const credential = await this.findCredential();
        if (!credential) {
            throw new common_1.NotFoundException('管理员账号尚未初始化');
        }
        if (!password_util_1.PasswordUtil.verify(String(currentPassword ?? ''), credential.passwordHash)) {
            throw new common_1.UnauthorizedException('当前密码不正确');
        }
        const usernameInput = (newUsername ?? '').trim();
        const passwordInput = newPassword ?? '';
        if (!usernameInput && !passwordInput) {
            throw new common_1.BadRequestException('请提供新的账号或新密码');
        }
        let changedUsername = false;
        let changedPassword = false;
        if (usernameInput && usernameInput !== credential.username) {
            credential.username = this.validateUsername(usernameInput);
            changedUsername = true;
        }
        if (passwordInput) {
            this.validatePassword(passwordInput);
            if (password_util_1.PasswordUtil.verify(passwordInput, credential.passwordHash)) {
                throw new common_1.BadRequestException('新密码不能与当前密码相同');
            }
            credential.passwordHash = password_util_1.PasswordUtil.hash(passwordInput);
            credential.passwordUpdatedAt = new Date();
            changedPassword = true;
        }
        await this.credentialRepository.save(credential);
        let revokedSessions = 0;
        if (changedPassword) {
            const result = await this.sessionRepository.delete({
                id: (0, typeorm_2.Not)(sessionId),
            });
            revokedSessions = result.affected ?? 0;
        }
        this.logger.warn(`管理员凭据已更新: 账号变更=${changedUsername} 密码变更=${changedPassword} 失效会话=${revokedSessions}`);
        return {
            username: credential.username,
            changedUsername,
            changedPassword,
            revokedSessions,
        };
    }
    static extractToken(request) {
        const authorization = request.headers['authorization'];
        const rawHeader = Array.isArray(authorization) ? authorization[0] : authorization;
        if (rawHeader && /^bearer\s+/i.test(rawHeader)) {
            return rawHeader.replace(/^bearer\s+/i, '').trim();
        }
        const custom = request.headers['x-admin-token'];
        const rawCustom = Array.isArray(custom) ? custom[0] : custom;
        return (rawCustom || '').trim();
    }
    async createSession(credential, meta) {
        const token = password_util_1.PasswordUtil.generateToken();
        const expiresAt = new Date(Date.now() + this.sessionTtlMs);
        await this.sessionRepository.save(this.sessionRepository.create({
            tokenHash: this.hashToken(token),
            expiresAt,
            ip: meta.ip,
            userAgent: (meta.userAgent || '').slice(0, 255),
            lastSeenAt: new Date(),
        }));
        return { token, expiresAt, username: credential.username };
    }
    findCredential() {
        return this.credentialRepository.findOne({ where: { id: 1 } });
    }
    hashToken(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    validateUsername(username) {
        const value = (username ?? '').trim();
        if (value.length < MIN_USERNAME_LENGTH || value.length > MAX_USERNAME_LENGTH) {
            throw new common_1.BadRequestException(`账号长度需在 ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} 个字符之间`);
        }
        if (/[\s\u0000-\u001f\u007f]/.test(value)) {
            throw new common_1.BadRequestException('账号不能包含空格或控制字符');
        }
        return value;
    }
    validatePassword(password) {
        const value = String(password ?? '');
        if (value.length < MIN_PASSWORD_LENGTH || value.length > MAX_PASSWORD_LENGTH) {
            throw new common_1.BadRequestException(`密码长度需在 ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} 个字符之间`);
        }
        if (/[\u0000-\u001f\u007f]/.test(value)) {
            throw new common_1.BadRequestException('密码不能包含控制字符');
        }
    }
    assertSetupAllowed(ip) {
        const allowList = (process.env.SETUP_ALLOWED_IPS || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        if (allowList.length === 0) {
            return;
        }
        if (!allowList.includes(ip)) {
            this.logger.warn(`拒绝来自 ${ip} 的初始化请求（不在 SETUP_ALLOWED_IPS 中）`);
            throw new common_1.HttpException('当前 IP 不被允许初始化管理员账号', common_1.HttpStatus.FORBIDDEN);
        }
    }
    assertLoginAllowed(ip) {
        const record = this.failures.get(ip);
        if (!record) {
            return;
        }
        if (record.lockedUntil > Date.now()) {
            const remainMinutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
            throw new common_1.HttpException(`登录失败次数过多，请 ${remainMinutes} 分钟后再试`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (Date.now() - record.firstAt > LOGIN_FAIL_WINDOW_MS) {
            this.failures.delete(ip);
        }
    }
    recordFailure(ip) {
        const now = Date.now();
        const record = this.failures.get(ip);
        if (!record || now - record.firstAt > LOGIN_FAIL_WINDOW_MS) {
            this.failures.set(ip, { count: 1, firstAt: now, lockedUntil: 0 });
            return;
        }
        record.count += 1;
        if (record.count >= LOGIN_FAIL_LIMIT) {
            record.lockedUntil = now + LOGIN_LOCK_MS;
            this.logger.warn(`IP ${ip} 登录失败 ${record.count} 次，锁定 10 分钟`);
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_credential_entity_1.AdminCredential)),
    __param(1, (0, typeorm_1.InjectRepository)(admin_session_entity_1.AdminSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map