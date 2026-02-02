import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      process.env.WEB_ADMIN_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://algoretail.vercel.app', // Explicitly allow production domain
    ],
    credentials: true,
  });

  // Enable Global Validation Pipe (Critical for DTO transformation)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Auto-transform payloads to DTO instances
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error on extra props
    }),
  );

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Algo Retail API')
    .setDescription('The Algo Retail Backend API documentation')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .addApiKey(
      { type: 'apiKey', name: 'x-tenant-id', in: 'header' },
      'x-tenant-id',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
