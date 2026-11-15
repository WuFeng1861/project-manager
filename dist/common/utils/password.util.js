"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordUtil = void 0;
const node_crypto_1 = require("node:crypto");
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const MAX_MEM = 64 * 1024 * 1024;
const PREFIX = 'scrypt';
class PasswordUtil {
    static hash(plainPassword) {
        const salt = (0, node_crypto_1.randomBytes)(SALT_BYTES);
        const hash = (0, node_crypto_1.scryptSync)(this.normalize(plainPassword), salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: MAX_MEM });
        return [
            PREFIX,
            SCRYPT_N,
            SCRYPT_R,
            SCRYPT_P,
            salt.toString('base64'),
            hash.toString('base64'),
        ].join('$');
    }
    static verify(plainPassword, storedHash) {
        try {
            const parts = (storedHash || '').split('$');
            if (parts.length !== 6 || parts[0] !== PREFIX) {
                return false;
            }
            const [, n, r, p, saltB64, hashB64] = parts;
            const salt = Buffer.from(saltB64, 'base64');
            const expected = Buffer.from(hashB64, 'base64');
            if (!salt.length || !expected.length) {
                return false;
            }
            const actual = (0, node_crypto_1.scryptSync)(this.normalize(plainPassword), salt, expected.length, {
                N: Number(n),
                r: Number(r),
                p: Number(p),
                maxmem: MAX_MEM,
            });
            return expected.length === actual.length && (0, node_crypto_1.timingSafeEqual)(expected, actual);
        }
        catch {
            return false;
        }
    }
    static generateToken() {
        return (0, node_crypto_1.randomBytes)(32).toString('hex');
    }
    static normalize(value) {
        return String(value ?? '').normalize('NFKC');
    }
}
exports.PasswordUtil = PasswordUtil;
//# sourceMappingURL=password.util.js.map