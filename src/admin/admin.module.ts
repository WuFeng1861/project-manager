import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminCredential } from './entities/admin-credential.entity';
import { AdminSession } from './entities/admin-session.entity';
import { IpWhitelist } from './entities/ip-whitelist.entity';
import { Project } from '../projects/entities/project.entity';
import { IpBlockModule } from '../rate-limit/ip-block.module';
import { AdminService } from './admin.service';
import { IpWhitelistService } from './ip-whitelist.service';
import { AdminController } from './admin.controller';
import { AdminTokenGuard } from './guards/admin-token.guard';
import { UploadWhitelistGuard } from './guards/upload-whitelist.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminCredential,
      AdminSession,
      IpWhitelist,
      Project,
    ]),
    IpBlockModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    IpWhitelistService,
    AdminTokenGuard,
    UploadWhitelistGuard,
  ],
  exports: [
    AdminService,
    IpWhitelistService,
    AdminTokenGuard,
    UploadWhitelistGuard,
  ],
})
export class AdminModule {}
