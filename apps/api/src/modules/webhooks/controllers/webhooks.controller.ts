import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ReceiveWebhookResponseDto } from '../dto/receive-webhook-response.dto';
import { ReceiveWebhookService } from '../services/receive-webhook.service';
import type { RawBodyRequest } from '../types/raw-body-request.type';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly receiveWebhookService: ReceiveWebhookService) {}

  @Post(':partner')
  @HttpCode(202)
  async receive(
    @Param('partner') partner: string,
    @Headers() headers: Record<string, unknown>,
    @Body() body: unknown,
    @Req() request: RawBodyRequest,
  ): Promise<ReceiveWebhookResponseDto> {
    return this.receiveWebhookService.execute({
      partner,
      headers,
      rawBody: request.rawBody?.toString('utf8'),
      payload: body,
    });
  }
}
