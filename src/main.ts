import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * 解析 TRUST_PROXY 配置：
 * - 未配置：自动信任本机与内网地址，可识别任意层数的内网代理
 * - true：信任整条代理链（仅当服务无法被直连时使用）
 * - false：不信任任何代理
 * - 数字：信任指定层数
 * - IP/CIDR 列表：只信任指定的代理地址（逗号分隔）
 */
function resolveTrustProxy(value?: string) {
  if (!value) {
    return ['loopback', 'linklocal', 'uniquelocal'];
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  app.set('trust proxy', resolveTrustProxy(configService.get('TRUST_PROXY')));
  
  // Setup global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // Setup global interceptor for response transformation
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // Setup global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Project Manager API')
    .setDescription('API for managing project information')
    .setVersion('1.0')
    .addTag('projects')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Enable CORS
  app.enableCors();
  
  await app.listen(5666);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
