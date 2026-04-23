import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { WebhookEventStatus } from 'generated/prisma/enums';

@Injectable()
export class WebhookEventsAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(status?: WebhookEventStatus) {
    return this.prisma.webhookRawEvent.findMany({
      where: status ? { status } : undefined,
      orderBy: {
        receivedAt: 'desc',
      },
      take: 100,
    });
  }

  async findById(id: string) {
    return this.prisma.webhookRawEvent.findUnique({
      where: { id },
      include: {
        webhookProcessingAttempts: {
          orderBy: {
            attemptNumber: 'asc',
          },
        },
      },
    });
  }

  async resetToQueued(id: string) {
    return this.prisma.webhookRawEvent.update({
      where: { id },
      data: {
        status: WebhookEventStatus.QUEUED,
        lastError: null,
      },
    });
  }
}
