import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import {
  sqsClient,
  webhookDlqBacklogGauge,
  webhookQueueBacklogGauge,
} from '@app/common';

@Injectable()
export class QueueMetricsPollerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(QueueMetricsPollerService.name);
  private interval?: NodeJS.Timeout;

  async onModuleInit() {
    await this.poll();

    this.interval = setInterval(async () => {
      await this.poll();
    }, 10000);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private async poll() {
    try {
      const mainQueueUrl = process.env.SQS_WEBHOOK_EVENTS_QUEUE_URL;
      const dlqUrl = process.env.SQS_WEBHOOK_EVENTS_DLQ_URL;

      if (!mainQueueUrl || !dlqUrl) {
        return;
      }

      const [mainResult, dlqResult] = await Promise.all([
        sqsClient.send(
          new GetQueueAttributesCommand({
            QueueUrl: mainQueueUrl,
            AttributeNames: ['ApproximateNumberOfMessages'],
          }),
        ),
        sqsClient.send(
          new GetQueueAttributesCommand({
            QueueUrl: dlqUrl,
            AttributeNames: ['ApproximateNumberOfMessages'],
          }),
        ),
      ]);

      const mainVisible = Number(
        mainResult.Attributes?.ApproximateNumberOfMessages ?? 0,
      );

      const dlqVisible = Number(
        dlqResult.Attributes?.ApproximateNumberOfMessages ?? 0,
      );

      webhookQueueBacklogGauge.set(mainVisible);
      webhookDlqBacklogGauge.set(dlqVisible);
    } catch (error) {
      this.logger.error(
        `Failed to poll queue metrics: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
