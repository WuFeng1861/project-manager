export declare class PasswordUtil {
    static hash(plainPassword: string): string;
    static verify(plainPassword: string, storedHash: string): boolean;
    static generateToken(): string;
    private static normalize;
}
