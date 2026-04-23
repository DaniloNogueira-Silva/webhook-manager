import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WebhookEventStatus } from 'generated/prisma/enums';
import { WebhookEventsWorkerRepository } from '../../repositories/webhook-events-worker.repository';
import { ProcessingAttemptTrackerService } from './processing-attempt-tracker.service';

@Injectable()
export class WebhookEventProcessorService {
  private readonly logger = new Logger(WebhookEventProcessorService.name);

  constructor(
    private readonly webhookEventsWorkerRepository: WebhookEventsWorkerRepository,
    private readonly processingAttemptTrackerService: ProcessingAttemptTrackerService,
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

    const attempt =
      await this.processingAttemptTrackerService.start(webhookRecordId);

    try {
      await this.webhookEventsWorkerRepository.updateStatus(
        webhookRecordId,
        WebhookEventStatus.PROCESSING,
      );

      this.logger.log(
        `Processing event ${webhookRecordId} attempt=${attempt.attemptNumber} source=${event.source} type=${event.eventType}`,
      );

      await this.simulateBusinessProcessing(event.payloadJson);

      await this.webhookEventsWorkerRepository.markProcessed(webhookRecordId);
      await this.processingAttemptTrackerService.succeed(
        attempt.attemptId,
        attempt.startedAt,
      );

      this.logger.log(
        `Event processed successfully: ${webhookRecordId} attempt=${attempt.attemptNumber}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown processing error';

      await this.processingAttemptTrackerService.fail(
        attempt.attemptId,
        attempt.startedAt,
        errorMessage,
      );

      throw error;
    }
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
