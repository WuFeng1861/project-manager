import { Request } from 'express';

/**
 * 获取请求的原始客户端 IP 及完整代理链
 */
export class ClientIpUtil {
  static getClientIp(request: Request): string {
    // 启用 trust proxy 后，request.ip 已是代理链中最近的真实客户端地址
    const rawIp = request.ip || request.socket?.remoteAddress || '';
    return this.normalize(rawIp);
  }

  /**
   * 用于白名单/黑名单判定的可信客户端 IP
   *
   * 与 getClientIp 的差别：不无条件相信 X-Forwarded-For。
   * - 直连方是回环/内网地址（说明请求来自本机 nginx 等可信代理）时，
   *   采用 express 依 trust proxy 解析出的真实客户端地址；
   * - 直连方本身是公网地址（说明绕过代理直接打了服务端口）时，
   *   直接使用直连地址，避免有人伪造 XFF 头冒充白名单 IP。
   */
  static getTrustedClientIp(request: Request): string {
    const direct = this.normalize(request.socket?.remoteAddress || '');

    if (!direct || this.isPrivateOrLoopback(direct)) {
      return this.getClientIp(request) || direct;
    }

    return direct;
  }

  /**
   * 获取本次请求涉及的 IP 列表，顺序为：原始客户端 -> 各级代理 -> 直连地址
   */
  static getRequestIps(request: Request): string[] {
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

  /** 是否为回环或内网地址（IPv4 / IPv6） */
  static isPrivateOrLoopback(ip: string): boolean {
    const value = this.normalize(ip);
    if (!value) {
      return false;
    }

    if (value === '127.0.0.1' || value === '0.0.0.0') {
      return true;
    }

    if (value.includes(':')) {
      const lower = value.toLowerCase();
      return (
        lower === '::1' ||
        lower.startsWith('fe80:') ||
        lower.startsWith('fc') ||
        lower.startsWith('fd')
      );
    }

    const parts = value.split('.').map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
      return false;
    }

    const [a, b] = parts;
    return (
      a === 127 ||
      a === 10 ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 169 && b === 254)
    );
  }

  private static normalize(ip: string): string {
    return (ip || '')
      .trim()
      .replace(/^::ffff:/i, '')
      // IPv6 回环统一成 127.0.0.1，避免同一台机器出现两种写法
      .replace(/^::1$/, '127.0.0.1');
  }
}
