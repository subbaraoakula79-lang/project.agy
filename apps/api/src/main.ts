import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3001');

  // Global validation pipe — validates DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation (development only)
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('YatraSeva API')
      .setDescription('Ride-hailing platform API documentation')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addTag('health', 'Health check endpoints')
      .addTag('auth', 'Authentication endpoints')
      .addTag('rides', 'Ride management')
      .addTag('drivers', 'Driver management')
      .addTag('admin', 'Admin dashboard')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
  }

  await app.listen(port);
  console.log(`🚀 YatraSeva API running on http://localhost:${port}`);
  console.log(`🌍 Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
  console.log(`📡 CORS origin: ${corsOrigin}`);
}

bootstrap();
