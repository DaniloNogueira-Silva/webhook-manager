import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import { sqsClient } from '@app/common';
import { WebhookEventStatus } from 'generated/prisma/enums';
import { WebhookEventProcessorService } from '../../processing/services/webhook-event-processor.service';
import { WebhookEventsWorkerRepository } from '../../repositories/webhook-events-worker.repository';
import { webhookDeadLetteredCounter } from '@app/common';

type QueueMessageBody = {
  webhookRecordId: string;
  source: string;
  eventType: string;
  externalEventId?: string | null;
  queuedAt?: string;
};

@Injectable()
export class WorkerOrchestratorService {
  private readonly logger = new Logger(WorkerOrchestratorService.name);
  private readonly queueUrl = process.env.SQS_WEBHOOK_EVENTS_QUEUE_URL!;
  private readonly maxReceiveCount = Number(
    process.env.SQS_MAX_RECEIVE_COUNT ?? 3,
  );
  private isRunning = false;

  constructor(
    private readonly webhookEventProcessorService: WebhookEventProcessorService,
    private readonly webhookEventsWorkerRepository: WebhookEventsWorkerRepository,
  ) {}

  async start() {
    if (this.isRunning) {
      return;
    }

    if (!this.queueUrl) {
      throw new Error('SQS_WEBHOOK_EVENTS_QUEUE_URL is not configured');
    }

    this.isRunning = true;
    this.logger.log('Worker polling started');

    while (this.isRunning) {
      try {
        await this.pollOnce();
      } catch (error) {
        this.logger.error(
          `Worker polling error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }

      await this.sleep(Number(process.env.WORKER_POLL_INTERVAL_MS ?? 3000));
    }
  }

  stop() {
    this.isRunning = false;
    this.logger.log('Worker polling stopped');
  }

  private async pollOnce() {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: Number(process.env.WORKER_MAX_MESSAGES ?? 5),
      WaitTimeSeconds: Number(process.env.WORKER_WAIT_TIME_SECONDS ?? 10),
      AttributeNames: ['All'],
      MessageAttributeNames: ['All'],
    });

    const result = await sqsClient.send(command);
    const messages = result.Messages ?? [];

    if (!messages.length) {
      return;
    }

    this.logger.log(`Received ${messages.length} message(s) from queue`);

    for (const message of messages) {
      await this.handleMessage(message);
    }
  }

  private async handleMessage(message: Message) {
    if (!message.Body) {
      this.logger.warn('Skipping message without body');
      return;
    }

    let parsedBody: QueueMessageBody;

    try {
      parsedBody = JSON.parse(message.Body) as QueueMessageBody;
    } catch {
      this.logger.error(
        'Invalid queue message JSON. Message will not be deleted.',
      );
      return;
    }

    const webhookRecordId = parsedBody.webhookRecordId;

    if (!webhookRecordId) {
      this.logger.error(
        'Queue message missing webhookRecordId. Message will not be deleted.',
      );
      return;
    }

    const approximateReceiveCount = Number(
      message.Attributes?.ApproximateReceiveCount ?? 1,
    );

    this.logger.log(
      `Handling queue message webhookRecordId=${webhookRecordId} receiveCount=${approximateReceiveCount}`,
    );

    try {
      await this.webhookEventProcessorService.process(webhookRecordId);

      if (message.ReceiptHandle) {
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          }),
        );

        this.logger.log(
          `Deleted message from queue for webhookRecordId=${webhookRecordId}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown processing error';

      this.logger.error(
        `Failed processing webhookRecordId=${webhookRecordId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (approximateReceiveCount >= this.maxReceiveCount) {
        await this.webhookEventsWorkerRepository.markDeadLettered(
          webhookRecordId,
          errorMessage,
        );

        webhookDeadLetteredCounter.inc({
          partner: parsedBody.source,
          event_type: parsedBody.eventType,
        });

        this.logger.warn(
          `Marked webhookRecordId=${webhookRecordId} as DEAD_LETTERED`,
        );
      } else {
        await this.webhookEventsWorkerRepository.updateStatusWithError(
          webhookRecordId,
          WebhookEventStatus.FAILED,
          errorMessage,
        );
      }
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
