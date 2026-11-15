import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { AdminCredential } from './entities/admin-credential.entity';
import { AdminSession } from './entities/admin-session.entity';
export interface SessionMeta {
    ip: string;
    userAgent: string;
}
export interface AuthResult {
    token: string;
    expiresAt: Date;
    username: string;
}
export declare class AdminService implements OnModuleInit {
    private readonly credentialRepository;
    private readonly sessionRepository;
    private readonly logger;
    private readonly failures;
    private readonly sessionTtlMs;
    constructor(credentialRepository: Repository<AdminCredential>, sessionRepository: Repository<AdminSession>);
    onModuleInit(): Promise<void>;
    getStatus(): Promise<{
        initialized: boolean;
    }>;
    setup(username: string, password: string, meta: SessionMeta): Promise<AuthResult>;
    login(username: string, password: string, meta: SessionMeta): Promise<AuthResult>;
    validateSession(token: string): Promise<{
        sessionId: number;
        username: string;
    } | null>;
    logout(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getProfile(): Promise<{
        username: string;
        createdAt: Date;
        passwordUpdatedAt: Date;
    }>;
    changeCredentials(sessionId: number, currentPassword: string, newUsername?: string, newPassword?: string): Promise<{
        username: string;
        changedUsername: boolean;
        changedPassword: boolean;
        revokedSessions: number;
    }>;
    static extractToken(request: Request): string;
    private createSession;
    private findCredential;
    private hashToken;
    private validateUsername;
    private validatePassword;
    private assertSetupAllowed;
    private assertLoginAllowed;
    private recordFailure;
}
