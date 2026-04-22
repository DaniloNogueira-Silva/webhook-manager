import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ApiController } from './api.controller';
import { DatabaseModule } from '@app/database';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TerminusModule,
    DatabaseModule,
    WebhooksModule,
    QueueModule,
  ],
  controllers: [ApiController],
})
export class ApiModule {}
