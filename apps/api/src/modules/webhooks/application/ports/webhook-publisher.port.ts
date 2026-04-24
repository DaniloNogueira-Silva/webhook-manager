import type { PersistedWebhookEvent } from '../../domain/entities/webhook-event.entity';

export const WEBHOOK_PUBLISHER_PORT = Symbol('WEBHOOK_PUBLISHER_PORT');

export interface WebhookPublisherPort {
  publishWebhookEvent(event: PersistedWebhookEvent): Promise<void>;
}
