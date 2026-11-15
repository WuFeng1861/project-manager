import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ProjectsModule } from './projects/projects.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60*60*1000,
      max: 1000,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: configService.get('DB_DATABASE', 'project_manager.sqlite'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
      }),
    }),
    AdminModule,
    ProjectsModule,
    RateLimitModule,
  ],
})
export class AppModule {}
