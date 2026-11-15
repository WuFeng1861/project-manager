import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * 管理员口令哈希工具
 *
 * 设计要点：
 * - 使用 Node 内置 scrypt（内存困难型 KDF），不引入 bcrypt/argon2 等原生依赖，
 *   避免服务器缺少编译工具链时安装失败。
 * - 只存 `scrypt$N$r$p$salt$hash`，salt 每次随机 16 字节，口令永不以明文/可逆密文落库。
 * - 校验使用 timingSafeEqual，避免按字节比较泄露时序信息。
 */

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
// scrypt 内存需求约 128 * N * r = 16MiB，留足余量
const MAX_MEM = 64 * 1024 * 1024;

const PREFIX = 'scrypt';

export class PasswordUtil {
  /** 生成口令哈希串，格式：scrypt$N$r$p$salt(base64)$hash(base64) */
  static hash(plainPassword: string): string {
    const salt = randomBytes(SALT_BYTES);
    const hash = scryptSync(
      this.normalize(plainPassword),
      salt,
      KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: MAX_MEM },
    );

    return [
      PREFIX,
      SCRYPT_N,
      SCRYPT_R,
      SCRYPT_P,
      salt.toString('base64'),
      hash.toString('base64'),
    ].join('$');
  }

  /** 校验明文口令与库中哈希是否匹配 */
  static verify(plainPassword: string, storedHash: string): boolean {
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

      const actual = scryptSync(
        this.normalize(plainPassword),
        salt,
        expected.length,
        {
          N: Number(n),
          r: Number(r),
          p: Number(p),
          maxmem: MAX_MEM,
        },
      );

      return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }

  /** 生成不可预测的会话令牌（32 字节 -> 64 位十六进制） */
  static generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private static normalize(value: string): string {
    return String(value ?? '').normalize('NFKC');
  }
}
