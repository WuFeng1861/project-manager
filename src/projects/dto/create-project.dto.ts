import { IsString, IsNotEmpty, IsInt, IsOptional, IsPositive, IsPort, IsIP } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: 'Unique name of the service' })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty({ description: 'IP address of the server' })
  @IsIP(4)
  @IsNotEmpty()
  serverIp: string;

  @ApiProperty({ description: 'Port number of the service' })
  // @IsPort()
  @IsNotEmpty()
  servicePort: number;

  @ApiPropertyOptional({ description: 'Notes about the service' })
  @IsString()
  @IsOptional()
  serviceNotes?: string;

  @ApiProperty({ description: 'Runtime of the service in seconds' })
  @IsInt()
  @IsPositive()
  serviceRuntime: number;

  @ApiPropertyOptional({ description: 'Description of the service' })
  @IsString()
  @IsOptional()
  serviceDescription?: string;

  @ApiPropertyOptional({ description: 'Last time the service was restarted' })
  @IsOptional()
  lastRestartTime?: Date;

  @ApiProperty({ description: 'Password for the project' })
  @IsString()
  @IsNotEmpty()
  projectPassword: string;
}
