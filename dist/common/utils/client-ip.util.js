"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientIpUtil = void 0;
class ClientIpUtil {
    static getClientIp(request) {
        const rawIp = request.ip || request.socket?.remoteAddress || '';
        return this.normalize(rawIp);
    }
    static getTrustedClientIp(request) {
        const direct = this.normalize(request.socket?.remoteAddress || '');
        if (!direct || this.isPrivateOrLoopback(direct)) {
            return this.getClientIp(request) || direct;
        }
        return direct;
    }
    static getRequestIps(request) {
        const forwarded = request.headers['x-forwarded-for'];
        const rawHeader = Array.isArray(forwarded) ? forwarded.join(',') : forwarded;
        const chain = rawHeader
            ? rawHeader
                .split(',')
                .map((ip) => this.normalize(ip))
                .filter(Boolean)
            : [];
        const directIp = this.normalize(request.socket?.remoteAddress || '');
        if (directIp && !chain.includes(directIp)) {
            chain.push(directIp);
        }
        return chain;
    }
    static isPrivateOrLoopback(ip) {
        const value = this.normalize(ip);
        if (!value) {
            return false;
        }
        if (value === '127.0.0.1' || value === '0.0.0.0') {
            return true;
        }
        if (value.includes(':')) {
            const lower = value.toLowerCase();
            return (lower === '::1' ||
                lower.startsWith('fe80:') ||
                lower.startsWith('fc') ||
                lower.startsWith('fd'));
        }
        const parts = value.split('.').map((part) => Number(part));
        if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
            return false;
        }
        const [a, b] = parts;
        return (a === 127 ||
            a === 10 ||
            (a === 192 && b === 168) ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 169 && b === 254));
    }
    static normalize(ip) {
        return (ip || '')
            .trim()
            .replace(/^::ffff:/i, '')
            .replace(/^::1$/, '127.0.0.1');
    }
}
exports.ClientIpUtil = ClientIpUtil;
//# sourceMappingURL=client-ip.util.js.map