import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import { Request } from 'express';
import { AdminCredential } from './entities/admin-credential.entity';
import { AdminSession } from './entities/admin-session.entity';
import { PasswordUtil } from '../common/utils/password.util';

export interface SessionMeta {
  ip: string;
  userAgent: string;
}

export interface AuthResult {
  token: string;
  expiresAt: Date;
  username: string;
}

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/** 登录失败保护：同一 IP 10 分钟内失败 8 次，锁定 10 分钟 */
const LOGIN_FAIL_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_FAIL_LIMIT = 8;
const LOGIN_LOCK_MS = 10 * 60 * 1000;

interface FailureRecord {
  count: number;
  firstAt: number;
  lockedUntil: number;
}

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);
  private readonly failures = new Map<string, FailureRecord>();
  private readonly sessionTtlMs =
    Number(process.env.ADMIN_SESSION_TTL_HOURS || 168) * 60 * 60 * 1000;

  constructor(
    @InjectRepository(AdminCredential)
    private readonly credentialRepository: Repository<AdminCredential>,
    @InjectRepository(AdminSession)
    private readonly sessionRepository: Repository<AdminSession>,
  ) {}

  async onModuleInit(): Promise<void> {
    const removed = await this.sessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    if (removed.affected) {
      this.logger.log(`清理过期管理员会话 ${removed.affected} 条`);
    }
  }

  /** 前端用来判断"是否需要在首次进入时初始化账号密码" */
  async getStatus(): Promise<{ initialized: boolean }> {
    const credential = await this.findCredential();
    return { initialized: !!credential };
  }

  /** 首次初始化管理员账号（仅当库中不存在凭据时可用，之后永久关闭该入口） */
  async setup(
    username: string,
    password: string,
    meta: SessionMeta,
  ): Promise<AuthResult> {
    this.assertSetupAllowed(meta.ip);

    const existing = await this.findCredential();
    if (existing) {
      throw new ConflictException('管理员账号已初始化，请直接登录');
    }

    const safeUsername = this.validateUsername(username);
    this.validatePassword(password);

    const credential = this.credentialRepository.create({
      id: 1,
      username: safeUsername,
      passwordHash: PasswordUtil.hash(password),
      passwordUpdatedAt: new Date(),
    });

    try {
      await this.credentialRepository.save(credential);
    } catch (error) {
      // 并发初始化时唯一主键冲突，视作"已被初始化"
      this.logger.warn(`管理员初始化冲突: ${error.message}`);
      throw new ConflictException('管理员账号已初始化，请直接登录');
    }

    this.logger.warn(`管理员账号已初始化: ${safeUsername} (from ${meta.ip})`);
    return this.createSession(credential, meta);
  }

  /** 账号 + 密码登录 */
  async login(
    username: string,
    password: string,
    meta: SessionMeta,
  ): Promise<AuthResult> {
    this.assertLoginAllowed(meta.ip);

    const credential = await this.findCredential();
    if (!credential) {
      throw new ConflictException('管理员账号尚未初始化');
    }

    // 无论用户名是否匹配都执行一次哈希校验，避免通过响应时间探测账号是否存在
    const passwordOk = PasswordUtil.verify(
      String(password ?? ''),
      credential.passwordHash,
    );
    const usernameOk =
      credential.username.toLowerCase() === String(username ?? '').trim().toLowerCase();

    if (!usernameOk || !passwordOk) {
      this.recordFailure(meta.ip);
      throw new UnauthorizedException('账号或密码错误');
    }

    this.failures.delete(meta.ip);
    return this.createSession(credential, meta);
  }

  /** 校验会话令牌，返回会话信息；无效/过期返回 null */
  async validateSession(
    token: string,
  ): Promise<{ sessionId: number; username: string } | null> {
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

    // lastSeenAt 写入节流，避免每个请求都产生一次写盘
    const lastSeen = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
    if (Date.now() - lastSeen > 5 * 60 * 1000) {
      await this.sessionRepository.update(
        { id: session.id },
        { lastSeenAt: new Date() },
      );
    }

    return { sessionId: session.id, username: credential.username };
  }

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    if (token) {
      await this.sessionRepository.delete({ tokenHash: this.hashToken(token) });
    }
    return { success: true, message: '已退出登录' };
  }

  async getProfile(): Promise<{
    username: string;
    createdAt: Date;
    passwordUpdatedAt: Date;
  }> {
    const credential = await this.findCredential();
    if (!credential) {
      throw new NotFoundException('管理员账号尚未初始化');
    }

    return {
      username: credential.username,
      createdAt: credential.createdAt,
      passwordUpdatedAt: credential.passwordUpdatedAt,
    };
  }

  /**
   * 修改管理员账号/密码
   *
   * 必须同时满足：请求携带有效会话令牌 + 当前密码正确。
   * 修改成功后，除当前会话外的其它会话全部失效，防止旧令牌继续可用。
   */
  async changeCredentials(
    sessionId: number,
    currentPassword: string,
    newUsername?: string,
    newPassword?: string,
  ): Promise<{
    username: string;
    changedUsername: boolean;
    changedPassword: boolean;
    revokedSessions: number;
  }> {
    const credential = await this.findCredential();
    if (!credential) {
      throw new NotFoundException('管理员账号尚未初始化');
    }

    if (!PasswordUtil.verify(String(currentPassword ?? ''), credential.passwordHash)) {
      throw new UnauthorizedException('当前密码不正确');
    }

    const usernameInput = (newUsername ?? '').trim();
    const passwordInput = newPassword ?? '';

    if (!usernameInput && !passwordInput) {
      throw new BadRequestException('请提供新的账号或新密码');
    }

    let changedUsername = false;
    let changedPassword = false;

    if (usernameInput && usernameInput !== credential.username) {
      credential.username = this.validateUsername(usernameInput);
      changedUsername = true;
    }

    if (passwordInput) {
      this.validatePassword(passwordInput);
      if (PasswordUtil.verify(passwordInput, credential.passwordHash)) {
        throw new BadRequestException('新密码不能与当前密码相同');
      }
      credential.passwordHash = PasswordUtil.hash(passwordInput);
      credential.passwordUpdatedAt = new Date();
      changedPassword = true;
    }

    await this.credentialRepository.save(credential);

    let revokedSessions = 0;
    if (changedPassword) {
      const result = await this.sessionRepository.delete({
        id: Not(sessionId),
      });
      revokedSessions = result.affected ?? 0;
    }

    this.logger.warn(
      `管理员凭据已更新: 账号变更=${changedUsername} 密码变更=${changedPassword} 失效会话=${revokedSessions}`,
    );

    return {
      username: credential.username,
      changedUsername,
      changedPassword,
      revokedSessions,
    };
  }

  /** 从请求头提取令牌，支持 Authorization: Bearer 与 x-admin-token */
  static extractToken(request: Request): string {
    const authorization = request.headers['authorization'];
    const rawHeader = Array.isArray(authorization) ? authorization[0] : authorization;

    if (rawHeader && /^bearer\s+/i.test(rawHeader)) {
      return rawHeader.replace(/^bearer\s+/i, '').trim();
    }

    const custom = request.headers['x-admin-token'];
    const rawCustom = Array.isArray(custom) ? custom[0] : custom;
    return (rawCustom || '').trim();
  }

  private async createSession(
    credential: AdminCredential,
    meta: SessionMeta,
  ): Promise<AuthResult> {
    const token = PasswordUtil.generateToken();
    const expiresAt = new Date(Date.now() + this.sessionTtlMs);

    await this.sessionRepository.save(
      this.sessionRepository.create({
        tokenHash: this.hashToken(token),
        expiresAt,
        ip: meta.ip,
        userAgent: (meta.userAgent || '').slice(0, 255),
        lastSeenAt: new Date(),
      }),
    );

    return { token, expiresAt, username: credential.username };
  }

  private findCredential(): Promise<AdminCredential | null> {
    return this.credentialRepository.findOne({ where: { id: 1 } });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private validateUsername(username: string): string {
    const value = (username ?? '').trim();

    if (value.length < MIN_USERNAME_LENGTH || value.length > MAX_USERNAME_LENGTH) {
      throw new BadRequestException(
        `账号长度需在 ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} 个字符之间`,
      );
    }

    if (/[\s\u0000-\u001f\u007f]/.test(value)) {
      throw new BadRequestException('账号不能包含空格或控制字符');
    }

    return value;
  }

  private validatePassword(password: string): void {
    const value = String(password ?? '');

    if (value.length < MIN_PASSWORD_LENGTH || value.length > MAX_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `密码长度需在 ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} 个字符之间`,
      );
    }

    if (/[\u0000-\u001f\u007f]/.test(value)) {
      throw new BadRequestException('密码不能包含控制字符');
    }
  }

  /**
   * 可选的初始化来源限制：配置 SETUP_ALLOWED_IPS 后，只有这些 IP 能完成首次初始化，
   * 避免"谁先访问谁成为管理员"。留空则不限制（与需求一致：首次进入网页直接设置）。
   */
  private assertSetupAllowed(ip: string): void {
    const allowList = (process.env.SETUP_ALLOWED_IPS || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (allowList.length === 0) {
      return;
    }

    if (!allowList.includes(ip)) {
      this.logger.warn(`拒绝来自 ${ip} 的初始化请求（不在 SETUP_ALLOWED_IPS 中）`);
      throw new HttpException(
        '当前 IP 不被允许初始化管理员账号',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertLoginAllowed(ip: string): void {    const record = this.failures.get(ip);
    if (!record) {
      return;
    }

    if (record.lockedUntil > Date.now()) {
      const remainMinutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      throw new HttpException(
        `登录失败次数过多，请 ${remainMinutes} 分钟后再试`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (Date.now() - record.firstAt > LOGIN_FAIL_WINDOW_MS) {
      this.failures.delete(ip);
    }
  }

  private recordFailure(ip: string): void {
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
}
