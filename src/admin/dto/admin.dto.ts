import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SetupAdminDto {
  @ApiProperty({ description: '管理员账号' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  username: string;

  @ApiProperty({ description: '管理员密码（至少 8 位）' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}

export class LoginDto {
  @ApiProperty({ description: '管理员账号' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '管理员密码' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ChangeCredentialsDto {
  @ApiProperty({ description: '当前密码（用于二次确认）' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiPropertyOptional({ description: '新账号，留空表示不修改' })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  username?: string;

  @ApiPropertyOptional({ description: '新密码，留空表示不修改' })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  newPassword?: string;
}

export class BlockIpDto {
  @ApiProperty({ description: '要封禁的 IP' })
  @IsString()
  @IsNotEmpty()
  ip: string;

  @ApiPropertyOptional({ description: '封禁时长（小时），留空使用默认值' })
  @IsOptional()
  durationHours?: number;

  @ApiPropertyOptional({ description: '封禁原因' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  reason?: string;
}

export class AddWhitelistDto {
  @ApiProperty({ description: '加入白名单的 IP' })
  @IsString()
  @IsNotEmpty()
  ip: string;

  @ApiPropertyOptional({ description: '备注，例如所属项目' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  note?: string;
}
