import { Injectable } from '@nestjs/common';
import { SqsProducerService } from '../../../queue/services/sqs-producer.service';
import type { PersistedWebhookEvent } from '../../domain/entities/webhook-event.entity';
import type { WebhookPublisherPort } from '../ports/webhook-publisher.port';

@Injectable()
export class WebhookPublisherAdapter implements WebhookPublisherPort {
  constructor(private readonly sqsProducerService: SqsProducerService) {}

  async publishWebhookEvent(event: PersistedWebhookEvent): Promise<void> {
    await this.sqsProducerService.publishWebhookEvent(event.toQueueMessage());
  }
}
