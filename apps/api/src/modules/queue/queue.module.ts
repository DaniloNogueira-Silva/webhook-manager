import { Module } from '@nestjs/common';
import { SqsProducerService } from './services/sqs-producer.service';

@Module({
  providers: [SqsProducerService],
  exports: [SqsProducerService],
})
export class QueueModule {}
