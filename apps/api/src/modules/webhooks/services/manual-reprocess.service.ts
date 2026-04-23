import { Injectable, NotFoundException } from '@nestjs/common';
import { SqsProducerService } from '../../queue/services/sqs-producer.service';
import { WebhookEventsAdminRepository } from '../repositories/webhook-events-admin.repository';

@Injectable()
export class ManualReprocessService {
  constructor(
    private readonly webhookEventsAdminRepository: WebhookEventsAdminRepository,
    private readonly sqsProducerService: SqsProducerService,
  ) {}

  async execute(id: string) {
    const event = await this.webhookEventsAdminRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Webhook event not found: ${id}`);
    }

    await this.sqsProducerService.publishWebhookEvent({
      webhookRecordId: event.id,
      source: event.source,
      eventType: event.eventType,
      externalEventId: event.externalEventId,
    });

    const updated = await this.webhookEventsAdminRepository.resetToQueued(id);

    return {
      eventId: updated.id,
      status: updated.status,
    };
  }
}
