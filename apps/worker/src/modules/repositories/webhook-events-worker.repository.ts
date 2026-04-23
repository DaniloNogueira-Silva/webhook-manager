import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { WebhookEventStatus } from 'generated/prisma/enums';

@Injectable()
export class WebhookEventsWorkerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.webhookRawEvent.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: string, status: WebhookEventStatus) {
    return this.prisma.webhookRawEvent.update({
      where: { id },
      data: {
        status,
      },
    });
  }

  async updateStatusWithError(
    id: string,
    status: WebhookEventStatus,
    lastError: string,
  ) {
    return this.prisma.webhookRawEvent.update({
      where: { id },
      data: {
        status,
        lastError,
      },
    });
  }

  async markProcessed(id: string) {
    return this.prisma.webhookRawEvent.update({
      where: { id },
      data: {
        status: WebhookEventStatus.PROCESSED,
        processedAt: new Date(),
        lastError: null,
      },
    });
  }

  async markDeadLettered(id: string, lastError: string) {
    return this.prisma.webhookRawEvent.update({
      where: { id },
      data: {
        status: WebhookEventStatus.DEAD_LETTERED,
        lastError,
      },
    });
  }
}
