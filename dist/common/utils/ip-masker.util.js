"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpMasker = void 0;
class IpMasker {
    static maskIp(ip) {
        if (!ip)
            return ip;
        const parts = ip.split('.');
        if (parts.length !== 4)
            return ip;
        return `${parts[0]}.*.*.${parts[3]}`;
    }
}
exports.IpMasker = IpMasker;
//# sourceMappingURL=ip-masker.util.js.map