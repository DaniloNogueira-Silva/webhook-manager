import { Module } from '@nestjs/common';
import { WebhookEventProcessorService } from './webhook-event-processor.service';
import { WebhookEventsWorkerRepository } from '../../repositories/webhook-events-worker.repository';

@Module({
  providers: [WebhookEventsWorkerRepository, WebhookEventProcessorService],
  exports: [WebhookEventProcessorService, WebhookEventsWorkerRepository],
})
export class ProcessingModule {}
