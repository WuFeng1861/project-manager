import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from '../admin/admin.module';
import { IpBlockModule } from './ip-block.module';
import { IpRateLimitGuard } from './ip-rate-limit.guard';

@Module({
  imports: [IpBlockModule, AdminModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: IpRateLimitGuard,
    },
  ],
  exports: [IpBlockModule],
})
export class RateLimitModule {}
