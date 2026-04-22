import { Module } from '@nestjs/common';
import { WebhooksController } from './controllers/webhooks.controller';
import { WebhookEventsRepository } from './repositories/webhook-events.repository';
import { ReceiveWebhookService } from './services/receive-webhook.service';
import { WebhookSecretService } from './services/webhook-secret.service';
import { WebhookSignatureValidatorService } from './services/webhook-signature-validator.service';

@Module({
  controllers: [WebhooksController],
  providers: [
    ReceiveWebhookService,
    WebhookEventsRepository,
    WebhookSecretService,
    WebhookSignatureValidatorService,
  ],
})
export class WebhooksModule {}
