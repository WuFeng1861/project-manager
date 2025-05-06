import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
