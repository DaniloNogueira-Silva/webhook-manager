import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { WebhookEventsRepository } from '../repositories/webhook-events.repository';

type ReceiveWebhookInput = {
  partner: string;
  headers: Record<string, unknown>;
  rawBody?: string;
  payload: unknown;
};

@Injectable()
export class ReceiveWebhookService {
  constructor(
    private readonly webhookEventsRepository: WebhookEventsRepository,
  ) {}

  async execute(input: ReceiveWebhookInput) {
    if (!input.partner) {
      throw new BadRequestException('Partner is required');
    }

    if (!input.rawBody) {
      throw new BadRequestException('Raw body is required');
    }

    const eventType = this.extractEventType(input.payload);
    const externalEventId = this.extractExternalEventId(input.payload);
    const signature = this.extractSignature(input.headers);

    if (externalEventId) {
      const existing =
        await this.webhookEventsRepository.findBySourceAndExternalEventId(
          input.partner,
          externalEventId,
        );

      if (existing) {
        throw new ConflictException({
          message: 'Webhook already received',
          source: input.partner,
          externalEventId,
        });
      }
    }

    console.log('Webhook received', {
      partner: input.partner,
      rawBodyLength: input.rawBody.length,
      eventType,
      externalEventId,
    });

    const created = await this.webhookEventsRepository.create({
      source: input.partner,
      eventType,
      externalEventId,
      signature,
      headersJson: input.headers,
      payloadJson: input.payload,
    });

    return {
      eventId: created.id,
      status: created.status,
    };
  }

  private extractEventType(payload: unknown): string {
    if (
      payload &&
      typeof payload === 'object' &&
      'eventType' in payload &&
      typeof (payload as any).eventType === 'string'
    ) {
      return (payload as any).eventType;
    }

    if (
      payload &&
      typeof payload === 'object' &&
      'type' in payload &&
      typeof (payload as any).type === 'string'
    ) {
      return (payload as any).type;
    }

    return 'unknown';
  }

  private extractExternalEventId(payload: unknown): string | null {
    if (
      payload &&
      typeof payload === 'object' &&
      'id' in payload &&
      typeof (payload as any).id === 'string'
    ) {
      return (payload as any).id;
    }

    if (
      payload &&
      typeof payload === 'object' &&
      'eventId' in payload &&
      typeof (payload as any).eventId === 'string'
    ) {
      return (payload as any).eventId;
    }

    return null;
  }

  private extractSignature(headers: Record<string, unknown>): string | null {
    const candidates = [
      headers['x-signature'],
      headers['x-webhook-signature'],
      headers['stripe-signature'],
    ];

    const signature = candidates.find(
      (value) => typeof value === 'string' && value.length > 0,
    );

    return (signature as string) ?? null;
  }
}
