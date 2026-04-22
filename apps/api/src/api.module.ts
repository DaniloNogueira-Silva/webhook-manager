import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { DatabaseModule } from '@app/database';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TerminusModule,
    DatabaseModule,
    WebhooksModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
