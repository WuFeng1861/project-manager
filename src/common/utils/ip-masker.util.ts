/**
 * Utility to mask IP addresses for non-admin users
 */
export class IpMasker {
  /**
   * Masks the middle part of an IP address
   * E.g., 192.168.1.1 -> 192.*.*.1
   */
  static maskIp(ip: string): string {
    if (!ip) return ip;
    
    const parts = ip.split('.');
    if (parts.length !== 4) return ip; // Not a valid IPv4 address
    
    return `${parts[0]}.*.*.${ parts[3]}`;
  }
}