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

  private static normalize(ip: string): string {
    return (ip || '').trim().replace(/^::ffff:/, '');
  }
}
