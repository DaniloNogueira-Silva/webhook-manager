import { Controller, Get } from '@nestjs/common';
import { GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '@app/common';
import { PrismaService } from '@app/database';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;

    const queueUrl = process.env.SQS_WEBHOOK_EVENTS_QUEUE_URL;

    if (!queueUrl) {
      throw new Error('SQS_WEBHOOK_EVENTS_QUEUE_URL is not configured');
    }

    await sqsClient.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn'],
      }),
    );

    return {
      status: 'ok',
      database: 'up',
      queue: 'up',
    };
  }
}
