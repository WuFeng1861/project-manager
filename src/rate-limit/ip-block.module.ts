import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedIp } from './entities/blocked-ip.entity';
import { IpBlockService } from './ip-block.service';

/**
 * 只负责"IP 黑名单"数据本身，不依赖任何业务模块。
 * 拆出来是为了让 AdminModule / RateLimitModule 都能引用，而不会产生循环依赖。
 */
@Module({
  imports: [TypeOrmModule.forFeature([BlockedIp])],
  providers: [IpBlockService],
  exports: [IpBlockService],
})
export class IpBlockModule {}
