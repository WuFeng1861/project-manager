import { Request } from 'express';
export declare class ClientIpUtil {
    static getClientIp(request: Request): string;
    static getTrustedClientIp(request: Request): string;
    static getRequestIps(request: Request): string[];
    static isPrivateOrLoopback(ip: string): boolean;
    private static normalize;
}
