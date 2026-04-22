import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WebhookEventsWorkerRepository } from '../../repositories/webhook-events-worker.repository';
import { WebhookEventStatus } from 'generated/prisma/enums';

@Injectable()
export class WebhookEventProcessorService {
  private readonly logger = new Logger(WebhookEventProcessorService.name);

  constructor(
    private readonly webhookEventsWorkerRepository: WebhookEventsWorkerRepository,
  ) {}

  async process(webhookRecordId: string) {
    const event =
      await this.webhookEventsWorkerRepository.findById(webhookRecordId);

    if (!event) {
      throw new NotFoundException(
        `Webhook event not found: ${webhookRecordId}`,
      );
    }

    if (event.status === WebhookEventStatus.PROCESSED) {
      this.logger.warn(`Event already processed: ${webhookRecordId}`);
      return;
    }

    await this.webhookEventsWorkerRepository.updateStatus(
      webhookRecordId,
      WebhookEventStatus.PROCESSING,
    );

    this.logger.log(
      `Processing event ${webhookRecordId} source=${event.source} type=${event.eventType}`,
    );

    await this.simulateBusinessProcessing(event.payloadJson);

    await this.webhookEventsWorkerRepository.markProcessed(webhookRecordId);

    this.logger.log(`Event processed successfully: ${webhookRecordId}`);
  }

  private async simulateBusinessProcessing(payload: unknown) {
    if (
      payload &&
      typeof payload === 'object' &&
      'forceFail' in payload &&
      (payload as any).forceFail === true
    ) {
      throw new Error('Forced processing failure');
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
