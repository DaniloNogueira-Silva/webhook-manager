import { Module } from '@nestjs/common';
import { WebhookEventsWorkerRepository } from '../../repositories/webhook-events-worker.repository';
import { WebhookProcessingAttemptsRepository } from '../../repositories/webhook-processing-attempts.repository';
import { ProcessingAttemptTrackerService } from './processing-attempt-tracker.service';
import { WebhookEventProcessorService } from './webhook-event-processor.service';

@Module({
  providers: [
    WebhookEventsWorkerRepository,
    WebhookProcessingAttemptsRepository,
    ProcessingAttemptTrackerService,
    WebhookEventProcessorService,
  ],
  exports: [
    WebhookEventProcessorService,
    WebhookEventsWorkerRepository,
    WebhookProcessingAttemptsRepository,
    ProcessingAttemptTrackerService,
  ],
})
export class ProcessingModule {}
