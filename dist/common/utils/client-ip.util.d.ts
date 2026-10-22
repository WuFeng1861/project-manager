import { Request } from 'express';
export declare class ClientIpUtil {
    static getClientIp(request: Request): string;
    static getRequestIps(request: Request): string[];
    private static normalize;
}
