import { Injectable } from '@nestjs/common';
import {
  ReceiveWebhookUseCase,
  type ReceiveWebhookInput,
} from '../application/use-cases/receive-webhook.use-case';

@Injectable()
export class ReceiveWebhookService {
  constructor(private readonly receiveWebhookUseCase: ReceiveWebhookUseCase) {}

  async execute(input: ReceiveWebhookInput) {
    return this.receiveWebhookUseCase.execute(input);
  }
}
