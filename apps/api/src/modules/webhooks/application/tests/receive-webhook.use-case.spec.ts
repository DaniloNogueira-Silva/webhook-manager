import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Partner } from '../../domain/entities/partner.entity';
import {
  PersistedWebhookEvent,
  type NewWebhookEvent,
  type WebhookEventStatus,
} from '../../domain/entities/webhook-event.entity';
import type { PartnerConfigPort } from '../ports/partner-config.port';
import type { PayloadReaderPort } from '../ports/payload-reader.port';
import type { WebhookEventsPort } from '../ports/webhook-events.port';
import type { WebhookPublisherPort } from '../ports/webhook-publisher.port';
import type { WebhookSignatureValidatorPort } from '../ports/webhook-signature-validator.port';
import { ReceiveWebhookUseCase } from '../use-cases/receive-webhook.use-case';

class InMemoryPartnerConfigPort implements PartnerConfigPort {
  getActivePartnerOrFail(): Promise<Partner> {
    return Promise.resolve(
      new Partner(
        'acme',
        'event.type',
        'event.id',
        'x-signature',
        'NONE',
        null,
        null,
        null,
        null,
        null,
        null,
      ),
    );
  }
}

class InMemoryPayloadReaderPort implements PayloadReaderPort {
  getString(payload: unknown, pathExpression?: string | null): string | null {
    if (!pathExpression || typeof payload !== 'object' || payload === null) {
      return null;
    }

    return pathExpression.split('.').reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== 'object') {
        return null;
      }

      return (acc as Record<string, unknown>)[key] ?? null;
    }, payload) as string | null;
  }
}

class InMemorySignatureValidatorPort implements WebhookSignatureValidatorPort {
  validate(): void {
    return;
  }
}

class InMemoryWebhookPublisherPort implements WebhookPublisherPort {
  shouldFail = false;
  publishedEvents: PersistedWebhookEvent[] = [];

  publishWebhookEvent(event: PersistedWebhookEvent): Promise<void> {
    if (this.shouldFail) {
      return Promise.reject(new Error('publisher down'));
    }

    this.publishedEvents.push(event);
    return Promise.resolve();
  }
}

class InMemoryWebhookEventsPort implements WebhookEventsPort {
  events = new Map<string, PersistedWebhookEvent>();
  failures: Array<{
    id: string;
    status: WebhookEventStatus;
    lastError: string;
  }> = [];

  create(event: NewWebhookEvent): Promise<PersistedWebhookEvent> {
    const persisted = new PersistedWebhookEvent(
      `id-${this.events.size + 1}`,
      event.props.source,
      event.props.eventType,
      event.props.externalEventId,
      'RECEIVED',
    );

    this.events.set(persisted.id, persisted);

    return Promise.resolve(persisted);
  }

  findBySourceAndExternalEventId(
    source: string,
    externalEventId?: string | null,
  ): Promise<PersistedWebhookEvent | null> {
    for (const event of this.events.values()) {
      if (
        event.source === source &&
        event.externalEventId === externalEventId
      ) {
        return Promise.resolve(event);
      }
    }

    return Promise.resolve(null);
  }

  updateStatus(
    id: string,
    status: WebhookEventStatus,
  ): Promise<PersistedWebhookEvent> {
    const current = this.events.get(id);

    if (!current) {
      throw new Error('event not found');
    }

    const updated = new PersistedWebhookEvent(
      current.id,
      current.source,
      current.eventType,
      current.externalEventId,
      status,
    );

    this.events.set(id, updated);

    return Promise.resolve(updated);
  }

  updateStatusWithError(
    id: string,
    status: WebhookEventStatus,
    lastError: string,
  ): Promise<PersistedWebhookEvent> {
    this.failures.push({ id, status, lastError });
    return this.updateStatus(id, status);
  }
}

describe('ReceiveWebhookUseCase (integration with in-memory adapters)', () => {
  const buildUseCase = (publisherShouldFail = false) => {
    const events = new InMemoryWebhookEventsPort();
    const publisher = new InMemoryWebhookPublisherPort();
    publisher.shouldFail = publisherShouldFail;

    const useCase = new ReceiveWebhookUseCase(
      events,
      new InMemoryPartnerConfigPort(),
      new InMemoryPayloadReaderPort(),
      new InMemorySignatureValidatorPort(),
      publisher,
    );

    return { useCase, events, publisher };
  };

  it('should persist and queue webhook', async () => {
    const { useCase, events, publisher } = buildUseCase();

    const output = await useCase.execute({
      partner: 'acme',
      headers: { 'x-signature': 'abc' },
      rawBody: '{"ok":true}',
      payload: { event: { type: 'invoice.paid', id: 'evt-1' } },
    });

    expect(output.status).toBe('QUEUED');
    expect(publisher.publishedEvents).toHaveLength(1);
    expect([...events.events.values()][0]?.status).toBe('QUEUED');
  });

  it('should reject duplicate webhook', async () => {
    const { useCase } = buildUseCase();

    const input = {
      partner: 'acme',
      headers: { 'x-signature': 'abc' },
      rawBody: '{"ok":true}',
      payload: { event: { type: 'invoice.paid', id: 'evt-1' } },
    };

    await useCase.execute(input);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('should mark event as failed when queue publish fails', async () => {
    const { useCase, events } = buildUseCase(true);

    await expect(
      useCase.execute({
        partner: 'acme',
        headers: { 'x-signature': 'abc' },
        rawBody: '{"ok":true}',
        payload: { event: { type: 'invoice.paid', id: 'evt-1' } },
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect([...events.events.values()][0]?.status).toBe('FAILED');
    expect(events.failures[0]?.lastError).toBe('publisher down');
  });
});
