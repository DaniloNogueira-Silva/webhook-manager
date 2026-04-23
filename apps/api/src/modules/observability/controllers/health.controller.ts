import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '@app/common';
import { PrismaService } from '@app/database';

@ApiTags('observability')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/health')
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 500, description: 'Service is unhealthy' })
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
