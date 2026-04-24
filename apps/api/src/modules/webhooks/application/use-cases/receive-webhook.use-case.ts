import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { webhookQueuedCounter, webhookReceivedCounter } from '@app/common';
import {
  PARTNER_CONFIG_PORT,
  type PartnerConfigPort,
} from '../ports/partner-config.port';
import {
  WEBHOOK_EVENTS_PORT,
  type WebhookEventsPort,
} from '../ports/webhook-events.port';
import {
  WEBHOOK_PUBLISHER_PORT,
  type WebhookPublisherPort,
} from '../ports/webhook-publisher.port';
import {
  WEBHOOK_SIGNATURE_VALIDATOR_PORT,
  type WebhookSignatureValidatorPort,
} from '../ports/webhook-signature-validator.port';
import {
  PAYLOAD_READER_PORT,
  type PayloadReaderPort,
} from '../ports/payload-reader.port';
import { NewWebhookEvent } from '../../domain/entities/webhook-event.entity';

export type ReceiveWebhookInput = {
  partner: string;
  headers: Record<string, unknown>;
  rawBody?: string;
  payload: unknown;
};

@Injectable()
export class ReceiveWebhookUseCase {
  private readonly logger = new Logger(ReceiveWebhookUseCase.name);

  constructor(
    @Inject(WEBHOOK_EVENTS_PORT)
    private readonly webhookEventsPort: WebhookEventsPort,
    @Inject(PARTNER_CONFIG_PORT)
    private readonly partnerConfigPort: PartnerConfigPort,
    @Inject(PAYLOAD_READER_PORT)
    private readonly payloadReaderPort: PayloadReaderPort,
    @Inject(WEBHOOK_SIGNATURE_VALIDATOR_PORT)
    private readonly signatureValidatorPort: WebhookSignatureValidatorPort,
    @Inject(WEBHOOK_PUBLISHER_PORT)
    private readonly webhookPublisherPort: WebhookPublisherPort,
  ) {}

  async execute(input: ReceiveWebhookInput) {
    if (!input.partner) {
      throw new BadRequestException('Partner is required');
    }

    if (!input.rawBody) {
      throw new BadRequestException('Raw body is required');
    }

    this.logger.log(
      `Starting to process webhook for partner: ${input.partner}`,
    );

    const partner = await this.partnerConfigPort.getActivePartnerOrFail(
      input.partner,
    );

    webhookReceivedCounter.inc({ partner: partner.slug });

    this.signatureValidatorPort.validate({
      partner,
      rawBody: input.rawBody,
      headers: input.headers,
    });

    const eventType =
      this.payloadReaderPort.getString(input.payload, partner.eventTypePath) ??
      'unknown';

    const externalEventId = this.payloadReaderPort.getString(
      input.payload,
      partner.externalEventIdPath,
    );

    const signature = this.extractConfiguredSignature(
      input.headers,
      partner.signatureHeaderName,
    );

    if (externalEventId) {
      const existing =
        await this.webhookEventsPort.findBySourceAndExternalEventId(
          partner.slug,
          externalEventId,
        );

      if (existing) {
        throw new ConflictException({
          message: 'Webhook already received',
          source: partner.slug,
          externalEventId,
        });
      }
    }

    const newWebhookEvent = NewWebhookEvent.create({
      source: partner.slug,
      eventType,
      externalEventId,
      signature,
      headers: input.headers,
      payload: input.payload,
    });

    const created = await this.webhookEventsPort.create(newWebhookEvent);

    try {
      await this.webhookPublisherPort.publishWebhookEvent(created);

      webhookQueuedCounter.inc({ partner: created.source });

      const updated = await this.webhookEventsPort.updateStatus(
        created.id,
        'QUEUED',
      );

      this.logger.log(
        `Webhook for partner ${partner.slug} and external event ID ${externalEventId} queued`,
      );

      return {
        eventId: updated.id,
        status: updated.status,
      };
    } catch (error) {
      await this.webhookEventsPort.updateStatusWithError(
        created.id,
        'FAILED',
        error instanceof Error ? error.message : 'Unknown queue publish error',
      );

      throw new InternalServerErrorException(
        'Webhook persisted but failed to publish to queue',
      );
    }
  }

  private extractConfiguredSignature(
    headers: Record<string, unknown>,
    signatureHeaderName?: string | null,
  ): string | null {
    if (!signatureHeaderName) {
      return null;
    }

    const value = headers[signatureHeaderName.toLowerCase()];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }

    return null;
  }
}
