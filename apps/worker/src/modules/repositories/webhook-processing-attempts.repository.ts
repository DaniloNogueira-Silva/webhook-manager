import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { WebhookProcessingAttemptStatus } from 'generated/prisma/enums';

@Injectable()
export class WebhookProcessingAttemptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getNextAttemptNumber(webhookEventId: string): Promise<number> {
    const lastAttempt = await this.prisma.webhookProcessingAttempt.findFirst({
      where: { webhookEventId },
      orderBy: { attemptNumber: 'desc' },
    });

    return lastAttempt ? lastAttempt.attemptNumber + 1 : 1;
  }

  async createStarted(webhookEventId: string, attemptNumber: number) {
    return this.prisma.webhookProcessingAttempt.create({
      data: {
        webhookEventId,
        attemptNumber,
        status: WebhookProcessingAttemptStatus.STARTED,
      },
    });
  }

  async markSucceeded(id: string, latencyMs: number) {
    return this.prisma.webhookProcessingAttempt.update({
      where: { id },
      data: {
        status: WebhookProcessingAttemptStatus.SUCCEEDED,
        finishedAt: new Date(),
        latencyMs,
        errorMessage: null,
      },
    });
  }

  async markFailed(id: string, errorMessage: string, latencyMs: number) {
    return this.prisma.webhookProcessingAttempt.update({
      where: { id },
      data: {
        status: WebhookProcessingAttemptStatus.FAILED,
        finishedAt: new Date(),
        latencyMs,
        errorMessage,
      },
    });
  }
}
