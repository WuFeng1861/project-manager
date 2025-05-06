import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestartProjectDto {
  @ApiProperty({ description: 'Service name to restart' })
  @IsString()
  @IsNotEmpty()
  serviceName: string;
}