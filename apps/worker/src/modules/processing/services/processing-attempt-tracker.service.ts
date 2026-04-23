import { Injectable } from '@nestjs/common';
import { WebhookProcessingAttemptsRepository } from '../../repositories/webhook-processing-attempts.repository';

@Injectable()
export class ProcessingAttemptTrackerService {
  constructor(
    private readonly webhookProcessingAttemptsRepository: WebhookProcessingAttemptsRepository,
  ) {}

  async start(webhookEventId: string) {
    const attemptNumber =
      await this.webhookProcessingAttemptsRepository.getNextAttemptNumber(
        webhookEventId,
      );

    const attempt =
      await this.webhookProcessingAttemptsRepository.createStarted(
        webhookEventId,
        attemptNumber,
      );

    return {
      attemptId: attempt.id,
      attemptNumber,
      startedAt: attempt.startedAt,
    };
  }

  async succeed(attemptId: string, startedAt: Date) {
    const latencyMs = Date.now() - startedAt.getTime();

    await this.webhookProcessingAttemptsRepository.markSucceeded(
      attemptId,
      latencyMs,
    );
  }

  async fail(attemptId: string, startedAt: Date, errorMessage: string) {
    const latencyMs = Date.now() - startedAt.getTime();

    await this.webhookProcessingAttemptsRepository.markFailed(
      attemptId,
      errorMessage,
      latencyMs,
    );
  }
}
