import { NestFactory } from '@nestjs/core';
import { startWorkerMetricsServer } from './metrics-server';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  const metricsServer = startWorkerMetricsServer();

  console.log('Worker started');
  console.log(`NODE_ENV=${process.env.NODE_ENV}`);
  console.log(`AWS_ENDPOINT_URL=${process.env.AWS_ENDPOINT_URL}`);
  console.log(`QUEUE_URL=${process.env.SQS_WEBHOOK_EVENTS_QUEUE_URL}`);
  console.log(
    `WORKER_METRICS_URL=http://localhost:${process.env.WORKER_METRICS_PORT || 3002}`,
  );

  const shutdown = async () => {
    metricsServer.close();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
