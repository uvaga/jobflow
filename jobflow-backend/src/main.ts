import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: configService.get('cors.origin'),
    credentials: true,
  });

  // API prefix
  const apiPrefix = configService.get('api.prefix');
  const apiVersion = configService.get('api.version');
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  const port = configService.get('port');
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`);
}
bootstrap();
