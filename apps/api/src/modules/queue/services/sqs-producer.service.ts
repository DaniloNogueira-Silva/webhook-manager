import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '@app/common';

type PublishWebhookEventInput = {
  webhookRecordId: string;
  source: string;
  eventType: string;
  externalEventId?: string | null;
};

@Injectable()
export class SqsProducerService {
  private readonly queueUrl = process.env.SQS_WEBHOOK_EVENTS_QUEUE_URL;

  async publishWebhookEvent(input: PublishWebhookEventInput) {
    if (!this.queueUrl) {
      throw new InternalServerErrorException(
        'SQS_WEBHOOK_EVENTS_QUEUE_URL is not configured',
      );
    }

    const messageBody = JSON.stringify({
      webhookRecordId: input.webhookRecordId,
      source: input.source,
      eventType: input.eventType,
      externalEventId: input.externalEventId ?? null,
      queuedAt: new Date().toISOString(),
    });

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: messageBody,
    });

    const result = await sqsClient.send(command);

    return {
      messageId: result.MessageId,
      md5OfBody: result.MD5OfMessageBody,
    };
  }
}
