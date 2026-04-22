import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule, {
    rawBody: true,
  });

  await app.listen(process.env.APP_PORT || 3000);

  console.log(
    `API running on http://localhost:${process.env.APP_PORT || 3000}`,
  );
}

bootstrap();
