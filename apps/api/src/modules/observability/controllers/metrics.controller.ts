import { Controller, Get, Header } from '@nestjs/common';
import { appMetricsRegistry } from '@app/common';

@Controller()
export class MetricsController {
  @Get('/metrics')
  @Header('Content-Type', appMetricsRegistry.contentType)
  async getMetrics() {
    return appMetricsRegistry.metrics();
  }
}
