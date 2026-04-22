import { Module } from '@nestjs/common';
import { SqsConsumerService } from './services/sqs-consumer.service';
import { WorkerOrchestratorService } from './services/worker-orchestrator.service';
import { ProcessingModule } from '../processing/services/processing.module';

@Module({
  imports: [ProcessingModule],
  providers: [SqsConsumerService, WorkerOrchestratorService],
})
export class ConsumerModule {}
