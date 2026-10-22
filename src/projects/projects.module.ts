import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { RateLimitModule } from '../rate-limit/rate-limit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    CacheModule.register({
      ttl: 60*60*1000,
      max: 1000,
    }),
    HttpModule,
    RateLimitModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}