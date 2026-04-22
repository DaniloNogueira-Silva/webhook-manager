import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { ApiModule } from './api.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);

  app.use(
    json({
      verify: (req: any, _res, buffer) => {
        req.rawBody = buffer.toString('utf8');
      },
    }),
  );

  app.use(
    urlencoded({
      extended: true,
      verify: (req: any, _res, buffer) => {
        req.rawBody = buffer.toString('utf8');
      },
    }),
  );

  await app.listen(process.env.APP_PORT || 3000);

  console.log(
    `API running on http://localhost:${process.env.APP_PORT || 3000}`,
  );
}

bootstrap();
