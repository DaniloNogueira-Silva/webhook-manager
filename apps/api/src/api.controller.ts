import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@app/database';

@ApiTags('api')
@Controller()
export class ApiController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/health')
  @ApiOperation({ summary: 'Root API Health check' })
  @ApiResponse({ status: 200, description: 'API is up' })
  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      service: 'api',
      database: 'up',
    };
  }
}
