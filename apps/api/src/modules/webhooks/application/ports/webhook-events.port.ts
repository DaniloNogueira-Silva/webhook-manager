import type {
  NewWebhookEvent,
  PersistedWebhookEvent,
  WebhookEventStatus,
} from '../../domain/entities/webhook-event.entity';

export const WEBHOOK_EVENTS_PORT = Symbol('WEBHOOK_EVENTS_PORT');

export interface WebhookEventsPort {
  create(event: NewWebhookEvent): Promise<PersistedWebhookEvent>;
  findBySourceAndExternalEventId(
    source: string,
    externalEventId?: string | null,
  ): Promise<PersistedWebhookEvent | null>;
  updateStatus(
    id: string,
    status: WebhookEventStatus,
  ): Promise<PersistedWebhookEvent>;
  updateStatusWithError(
    id: string,
    status: WebhookEventStatus,
    lastError: string,
  ): Promise<PersistedWebhookEvent>;
}
