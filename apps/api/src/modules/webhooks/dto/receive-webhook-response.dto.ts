import { ApiProperty } from '@nestjs/swagger';

export class ReceiveWebhookResponseDto {
  @ApiProperty({ description: 'The unique identifier for the received webhook event' })
  eventId!: string;

  @ApiProperty({ description: 'The current status of the webhook event' })
  status!: string;
}
