import { Module } from '@nestjs/common';
import { MetricsController } from './controllers/metrics.controller';
import { QueueMetricsPollerService } from './services/queue-metrics-poller.service';
import { HealthController } from './controllers/health.controller';

@Module({
  controllers: [MetricsController, HealthController],
  providers: [QueueMetricsPollerService],
})
export class ObservabilityModule {}
