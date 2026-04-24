import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReceiveWebhookResponseDto } from '../dto/receive-webhook-response.dto';
import { ReceiveWebhookService } from '../services/receive-webhook.service';
import type { RawBodyRequest } from '../types/raw-body-request.type';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly receiveWebhookService: ReceiveWebhookService) {}

  @Post(':partner')
  @HttpCode(202)
  @ApiOperation({ summary: 'Receive a webhook from a partner' })
  @ApiParam({
    name: 'partner',
    description: 'The slug of the partner integration',
    type: 'string',
  })
  @ApiResponse({
    status: 202,
    description: 'Webhook received and queued successfully',
    type: ReceiveWebhookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Missing or invalid payload',
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Webhook already received',
  })
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
