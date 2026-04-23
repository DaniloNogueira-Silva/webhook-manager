import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { WebhooksAdminController } from './controllers/webhooks-admin.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { PartnerIntegrationsRepository } from './repositories/partner-integrations.repository';
import { WebhookEventsAdminRepository } from './repositories/webhook-events-admin.repository';
import { WebhookEventsRepository } from './repositories/webhook-events.repository';
import { ManualReprocessService } from './services/manual-reprocess.service';
import { PartnerConfigService } from './services/partner-config.service';
import { PayloadPathReaderService } from './services/payload-path-reader.service';
import { ReceiveWebhookService } from './services/receive-webhook.service';
import { WebhookSignatureValidatorService } from './services/webhook-signature-validator.service';

@Module({
  imports: [QueueModule],
  controllers: [WebhooksController, WebhooksAdminController],
  providers: [
    ReceiveWebhookService,
    ManualReprocessService,
    WebhookEventsRepository,
    WebhookEventsAdminRepository,
    PartnerIntegrationsRepository,
    PartnerConfigService,
    PayloadPathReaderService,
    WebhookSignatureValidatorService,
  ],
})
export class WebhooksModule {}
