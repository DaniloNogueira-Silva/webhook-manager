import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { WebhooksController } from './controllers/webhooks.controller';
import { PartnerIntegrationsRepository } from './repositories/partner-integrations.repository';
import { WebhookEventsRepository } from './repositories/webhook-events.repository';
import { PartnerConfigService } from './services/partner-config.service';
import { PayloadPathReaderService } from './services/payload-path-reader.service';
import { ReceiveWebhookService } from './services/receive-webhook.service';
import { WebhookSignatureValidatorService } from './services/webhook-signature-validator.service';

@Module({
  imports: [QueueModule],
  controllers: [WebhooksController],
  providers: [
    ReceiveWebhookService,
    WebhookEventsRepository,
    PartnerIntegrationsRepository,
    PartnerConfigService,
    PayloadPathReaderService,
    WebhookSignatureValidatorService,
  ],
})
export class WebhooksModule {}
