import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { appMetricsRegistry } from '@app/common';

@ApiTags('observability')
@Controller()
export class MetricsController {
  @Get('/metrics')
  @Header('Content-Type', appMetricsRegistry.contentType)
  @ApiOperation({ summary: 'Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Metrics exposed successfully' })
  async getMetrics() {
    return appMetricsRegistry.metrics();
  }
}
