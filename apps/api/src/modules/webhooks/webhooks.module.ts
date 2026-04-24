import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PARTNER_CONFIG_PORT } from './application/ports/partner-config.port';
import { PAYLOAD_READER_PORT } from './application/ports/payload-reader.port';
import { WEBHOOK_EVENTS_PORT } from './application/ports/webhook-events.port';
import { WEBHOOK_PUBLISHER_PORT } from './application/ports/webhook-publisher.port';
import { WEBHOOK_SIGNATURE_VALIDATOR_PORT } from './application/ports/webhook-signature-validator.port';
import { ReceiveWebhookUseCase } from './application/use-cases/receive-webhook.use-case';
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
import { PartnerConfigAdapter } from './application/adapters/partner-config.adapter';
import { PayloadReaderAdapter } from './application/adapters/payload-reader.adapter';
import { WebhookEventsAdapter } from './application/adapters/webhook-events.adapter';
import { WebhookPublisherAdapter } from './application/adapters/webhook-publisher.adapter';
import { WebhookSignatureValidatorAdapter } from './application/adapters/webhook-signature-validator.adapter';

@Module({
  imports: [QueueModule],
  controllers: [WebhooksController, WebhooksAdminController],
  providers: [
    ReceiveWebhookService,
    ReceiveWebhookUseCase,
    ManualReprocessService,
    WebhookEventsRepository,
    WebhookEventsAdminRepository,
    PartnerIntegrationsRepository,
    PartnerConfigService,
    PayloadPathReaderService,
    WebhookSignatureValidatorService,
    PartnerConfigAdapter,
    PayloadReaderAdapter,
    WebhookEventsAdapter,
    WebhookPublisherAdapter,
    WebhookSignatureValidatorAdapter,
    {
      provide: WEBHOOK_EVENTS_PORT,
      useExisting: WebhookEventsAdapter,
    },
    {
      provide: PARTNER_CONFIG_PORT,
      useExisting: PartnerConfigAdapter,
    },
    {
      provide: PAYLOAD_READER_PORT,
      useExisting: PayloadReaderAdapter,
    },
    {
      provide: WEBHOOK_SIGNATURE_VALIDATOR_PORT,
      useExisting: WebhookSignatureValidatorAdapter,
    },
    {
      provide: WEBHOOK_PUBLISHER_PORT,
      useExisting: WebhookPublisherAdapter,
    },
  ],
})
export class WebhooksModule {}
