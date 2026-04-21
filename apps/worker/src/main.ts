import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);

  console.log('Worker started');
  console.log(`NODE_ENV=${process.env.NODE_ENV}`);
  console.log(`AWS_ENDPOINT_URL=${process.env.AWS_ENDPOINT_URL}`);

  // mantém o processo vivo no passo 1
  process.stdin.resume();

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
bootstrap();
