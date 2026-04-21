import { Controller, Get } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('/health')
  getHealth() {
    return {
      status: 'ok',
      service: 'api',
    };
  }

  @Get()
  getHello(): string {
    return this.apiService.getHello();
  }
}
