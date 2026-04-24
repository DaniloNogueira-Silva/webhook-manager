import { Injectable } from '@nestjs/common';
import { WebhookEventsRepository } from '../../repositories/webhook-events.repository';
import {
  NewWebhookEvent,
  PersistedWebhookEvent,
  type WebhookEventStatus,
} from '../../domain/entities/webhook-event.entity';
import type { WebhookEventsPort } from '../ports/webhook-events.port';

type WebhookEventPersistenceShape = {
  id: string;
  source: string;
  eventType: string;
  externalEventId: string | null;
  status: string;
};

@Injectable()
export class WebhookEventsAdapter implements WebhookEventsPort {
  constructor(
    private readonly webhookEventsRepository: WebhookEventsRepository,
  ) {}

  async create(event: NewWebhookEvent): Promise<PersistedWebhookEvent> {
    const created = (await this.webhookEventsRepository.create({
      source: event.props.source,
      eventType: event.props.eventType,
      externalEventId: event.props.externalEventId,
      signature: event.props.signature,
      headersJson: event.props.headers,
      payloadJson: event.props.payload,
    })) as WebhookEventPersistenceShape;

    return this.toDomain(created);
  }

  async findBySourceAndExternalEventId(
    source: string,
    externalEventId?: string | null,
  ): Promise<PersistedWebhookEvent | null> {
    const found =
      (await this.webhookEventsRepository.findBySourceAndExternalEventId(
        source,
        externalEventId,
      )) as WebhookEventPersistenceShape | null;

    return found ? this.toDomain(found) : null;
  }

  async updateStatus(
    id: string,
    status: WebhookEventStatus,
  ): Promise<PersistedWebhookEvent> {
    const updated = (await this.webhookEventsRepository.updateStatus(
      id,
      status,
    )) as WebhookEventPersistenceShape;

    return this.toDomain(updated);
  }

  async updateStatusWithError(
    id: string,
    status: WebhookEventStatus,
    lastError: string,
  ): Promise<PersistedWebhookEvent> {
    const updated = (await this.webhookEventsRepository.updateStatusWithError(
      id,
      status,
      lastError,
    )) as WebhookEventPersistenceShape;

    return this.toDomain(updated);
  }

  private toDomain(
    record: WebhookEventPersistenceShape,
  ): PersistedWebhookEvent {
    return new PersistedWebhookEvent(
      record.id,
      record.source,
      record.eventType,
      record.externalEventId,
      record.status as WebhookEventStatus,
    );
  }
}
