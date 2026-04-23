import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SqsProducerService } from '../../queue/services/sqs-producer.service';
import { WebhookEventsRepository } from '../repositories/webhook-events.repository';
import { PartnerConfigService } from './partner-config.service';
import { PayloadPathReaderService } from './payload-path-reader.service';
import { WebhookSignatureValidatorService } from './webhook-signature-validator.service';
import { WebhookEventStatus } from 'generated/prisma/enums';

type ReceiveWebhookInput = {
  partner: string;
  headers: Record<string, unknown>;
  rawBody?: string;
  payload: unknown;
};

@Injectable()
export class ReceiveWebhookService {
  private readonly logger = new Logger(ReceiveWebhookService.name);

  constructor(
    private readonly webhookEventsRepository: WebhookEventsRepository,
    private readonly partnerConfigService: PartnerConfigService,
    private readonly payloadPathReaderService: PayloadPathReaderService,
    private readonly webhookSignatureValidatorService: WebhookSignatureValidatorService,
    private readonly sqsProducerService: SqsProducerService,
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

    const partner = await this.partnerConfigService.getActivePartnerOrFail(
      input.partner,
    );

    this.webhookSignatureValidatorService.validate({
      partner,
      rawBody: input.rawBody,
      headers: input.headers,
    });

    const eventType =
      this.payloadPathReaderService.getString(
        input.payload,
        partner.eventTypePath,
      ) ?? 'unknown';

    const externalEventId = this.payloadPathReaderService.getString(
      input.payload,
      partner.externalEventIdPath,
    );

    const signature = this.extractConfiguredSignature(
      input.headers,
      partner.signatureHeaderName,
    );

    if (externalEventId) {
      const existing =
        await this.webhookEventsRepository.findBySourceAndExternalEventId(
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

    const created = await this.webhookEventsRepository.create({
      source: partner.slug,
      eventType,
      externalEventId,
      signature,
      headersJson: input.headers,
      payloadJson: input.payload,
    });

    try {
      await this.sqsProducerService.publishWebhookEvent({
        webhookRecordId: created.id,
        source: created.source,
        eventType: created.eventType,
        externalEventId: created.externalEventId,
      });

      const updated = await this.webhookEventsRepository.updateStatus(
        created.id,
        WebhookEventStatus.QUEUED,
      );

      this.logger.log(
        `Webhook for partner ${partner.slug} and external event ID ${externalEventId} queued`,
      );

      return {
        eventId: updated.id,
        status: updated.status,
      };
    } catch (error) {
      await this.webhookEventsRepository.updateStatusWithError(
        created.id,
        WebhookEventStatus.FAILED,
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
