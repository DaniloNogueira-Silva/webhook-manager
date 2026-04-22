import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { WorkerOrchestratorService } from './worker-orchestrator.service';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsConsumerService.name);

  constructor(
    private readonly workerOrchestratorService: WorkerOrchestratorService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing SQS consumer...');
    void this.workerOrchestratorService.start();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping SQS consumer...');
    this.workerOrchestratorService.stop();
  }
}
