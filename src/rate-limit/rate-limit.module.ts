import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedIp } from './entities/blocked-ip.entity';
import { IpBlockService } from './ip-block.service';
import { IpRateLimitGuard } from './ip-rate-limit.guard';

@Module({
  imports: [TypeOrmModule.forFeature([BlockedIp])],
  providers: [
    IpBlockService,
    {
      provide: APP_GUARD,
      useClass: IpRateLimitGuard,
    },
  ],
  exports: [IpBlockService],
})
export class RateLimitModule {}
