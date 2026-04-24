export type WebhookEventStatus = 'RECEIVED' | 'QUEUED' | 'FAILED';

export type NewWebhookEventProps = {
  source: string;
  eventType: string;
  externalEventId: string | null;
  signature: string | null;
  headers: Record<string, unknown>;
  payload: unknown;
};

export class NewWebhookEvent {
  constructor(readonly props: NewWebhookEventProps) {}

  static create(props: NewWebhookEventProps) {
    return new NewWebhookEvent(props);
  }
}

export class PersistedWebhookEvent {
  constructor(
    readonly id: string,
    readonly source: string,
    readonly eventType: string,
    readonly externalEventId: string | null,
    readonly status: WebhookEventStatus,
  ) {}

  toQueueMessage() {
    return {
      webhookRecordId: this.id,
      source: this.source,
      eventType: this.eventType,
      externalEventId: this.externalEventId,
    };
  }
}
