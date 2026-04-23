import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhookEventStatus } from 'generated/prisma/enums';
import { WebhookEventsAdminRepository } from '../repositories/webhook-events-admin.repository';
import { ManualReprocessService } from '../services/manual-reprocess.service';

@ApiTags('admin/webhooks')
@Controller('admin/webhooks')
export class WebhooksAdminController {
  constructor(
    private readonly webhookEventsAdminRepository: WebhookEventsAdminRepository,
    private readonly manualReprocessService: ManualReprocessService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List webhook events' })
  @ApiQuery({ name: 'status', enum: WebhookEventStatus, required: false, description: 'Filter by event status' })
  @ApiResponse({ status: 200, description: 'List of webhook events' })
  async list(@Query('status') status?: WebhookEventStatus) {
    return this.webhookEventsAdminRepository.findMany(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific webhook event' })
  @ApiParam({ name: 'id', description: 'The UUID of the webhook event' })
  @ApiResponse({ status: 200, description: 'Webhook event details' })
  @ApiResponse({ status: 404, description: 'Webhook event not found' })
  async detail(@Param('id') id: string) {
    return this.webhookEventsAdminRepository.findById(id);
  }

  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Manually reprocess a webhook event' })
  @ApiParam({ name: 'id', description: 'The UUID of the webhook event to reprocess' })
  @ApiResponse({ status: 200, description: 'Webhook event requeued successfully' })
  @ApiResponse({ status: 404, description: 'Webhook event not found' })
  async reprocess(@Param('id') id: string) {
    return this.manualReprocessService.execute(id);
  }
}
