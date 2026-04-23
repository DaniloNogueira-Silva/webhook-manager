import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiModule } from './api.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule, {
    rawBody: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Webhook Manager API')
    .setDescription('The Webhook Manager API documentation')
    .setVersion('1.0')
    .addTag('webhooks')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(process.env.APP_PORT || 3000);

  console.log(
    `API running on http://localhost:${process.env.APP_PORT || 3000}`,
  );
  console.log(
    `Swagger docs running on http://localhost:${process.env.APP_PORT || 3000}/api/docs`,
  );
}

bootstrap();
