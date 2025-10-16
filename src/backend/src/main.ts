import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // Specify NestExpressApplication

  const config = new DocumentBuilder()
    .setTitle('Living Lab API')
    .setDescription('The Living Lab API description')
    .setVersion('1.0')
    .addBearerAuth() // Add Bearer token authentication
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Enable CORS for all origins, to be removed before production
  app.enableCors();

  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/', // Define the URL prefix for accessing the files
  });

  await app.listen(process.env.BACKEND_PORT ?? 3000);
}
bootstrap();
