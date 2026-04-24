import { NewWebhookEvent, PersistedWebhookEvent } from './webhook-event.entity';

describe('WebhookEvent entities', () => {
  it('should create a new webhook event aggregate with raw input data', () => {
    const event = NewWebhookEvent.create({
      source: 'acme',
      eventType: 'payment.created',
      externalEventId: 'evt-1',
      signature: 'sha256=abc',
      headers: { 'x-signature': 'sha256=abc' },
      payload: { id: 1 },
    });

    expect(event.props.source).toBe('acme');
    expect(event.props.eventType).toBe('payment.created');
    expect(event.props.externalEventId).toBe('evt-1');
  });

  it('should map persisted event to queue message', () => {
    const persisted = new PersistedWebhookEvent(
      'uuid-1',
      'acme',
      'payment.created',
      'evt-1',
      'RECEIVED',
    );

    expect(persisted.toQueueMessage()).toEqual({
      webhookRecordId: 'uuid-1',
      source: 'acme',
      eventType: 'payment.created',
      externalEventId: 'evt-1',
    });
  });
});
