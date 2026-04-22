import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { WebhookEventStatus } from 'generated/prisma/enums';

type CreateWebhookRawEventParams = {
  source: string;
  eventType: string;
  externalEventId?: string | null;
  signature?: string | null;
  headersJson: Record<string, unknown>;
  payloadJson: unknown;
};

@Injectable()
export class WebhookEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: CreateWebhookRawEventParams) {
    return this.prisma.webhookRawEvent.create({
      data: {
        source: params.source,
        eventType: params.eventType,
        externalEventId: params.externalEventId ?? null,
        signature: params.signature ?? null,
        headersJson: params.headersJson as any,
        payloadJson: params.payloadJson as any,
        status: WebhookEventStatus.RECEIVED,
      },
    });
  }

  async findBySourceAndExternalEventId(
    source: string,
    externalEventId?: string | null,
  ) {
    if (!externalEventId) {
      return null;
    }

    return this.prisma.webhookRawEvent.findUnique({
      where: {
        source_externalEventId: {
          source,
          externalEventId,
        },
      },
    });
  }

  async updateStatus(id: string, status: WebhookEventStatus) {
    return this.prisma.webhookRawEvent.update({
      where: { id },
      data: { status },
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
}
