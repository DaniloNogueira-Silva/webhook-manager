import { Controller, Get } from '@nestjs/common';
import { ApiService } from './api.service';
import { PrismaService } from '@app/database';

@Controller()
export class ApiController {
  constructor(
    private readonly appService: ApiService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('/health')
  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      service: 'api',
      database: 'up',
    };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
