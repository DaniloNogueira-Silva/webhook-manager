import { Module } from '@nestjs/common';
import { WebhooksController } from './controllers/webhooks.controller';
import { WebhookEventsRepository } from './repositories/webhook-events.repository';
import { ReceiveWebhookService } from './services/receive-webhook.service';

@Module({
  controllers: [WebhooksController],
  providers: [ReceiveWebhookService, WebhookEventsRepository],
})
export class WebhooksModule {}
