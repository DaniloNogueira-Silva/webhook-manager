import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { WebhookEventStatus } from 'generated/prisma/enums';
import { WebhookEventsAdminRepository } from '../repositories/webhook-events-admin.repository';
import { ManualReprocessService } from '../services/manual-reprocess.service';

@Controller('admin/webhooks')
export class WebhooksAdminController {
  constructor(
    private readonly webhookEventsAdminRepository: WebhookEventsAdminRepository,
    private readonly manualReprocessService: ManualReprocessService,
  ) {}

  @Get()
  async list(@Query('status') status?: WebhookEventStatus) {
    return this.webhookEventsAdminRepository.findMany(status);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.webhookEventsAdminRepository.findById(id);
  }

  @Post(':id/reprocess')
  async reprocess(@Param('id') id: string) {
    return this.manualReprocessService.execute(id);
  }
}
