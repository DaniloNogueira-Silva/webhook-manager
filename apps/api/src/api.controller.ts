import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@app/database';

@Controller()
export class ApiController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/health')
  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      service: 'api',
      database: 'up',
    };
  }
}
