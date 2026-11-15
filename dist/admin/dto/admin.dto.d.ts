export declare class SetupAdminDto {
    username: string;
    password: string;
}
export declare class LoginDto {
    username: string;
    password: string;
}
export declare class ChangeCredentialsDto {
    currentPassword: string;
    username?: string;
    newPassword?: string;
}
export declare class BlockIpDto {
    ip: string;
    durationHours?: number;
    reason?: string;
}
export declare class AddWhitelistDto {
    ip: string;
    note?: string;
}
