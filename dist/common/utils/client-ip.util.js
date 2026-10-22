"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientIpUtil = void 0;
class ClientIpUtil {
    static getClientIp(request) {
        const rawIp = request.ip || request.socket?.remoteAddress || '';
        return this.normalize(rawIp);
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
    static normalize(ip) {
        return (ip || '').trim().replace(/^::ffff:/, '');
    }
}
exports.ClientIpUtil = ClientIpUtil;
//# sourceMappingURL=client-ip.util.js.map