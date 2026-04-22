import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { WebhookSecretService } from './webhook-secret.service';

type ValidateSignatureInput = {
  partner: string;
  rawBody?: string;
  headers: Record<string, unknown>;
};

@Injectable()
export class WebhookSignatureValidatorService {
  constructor(private readonly webhookSecretService: WebhookSecretService) {}

  validate(input: ValidateSignatureInput): void {
    const rawBody = input.rawBody;

    if (!rawBody) {
      throw new BadRequestException(
        'Raw body is required for signature validation',
      );
    }

    const timestamp = this.getHeader(input.headers, 'x-webhook-timestamp');
    const receivedSignature = this.getHeader(
      input.headers,
      'x-webhook-signature',
    );

    if (!timestamp) {
      throw new UnauthorizedException('Missing x-webhook-timestamp header');
    }

    if (!receivedSignature) {
      throw new UnauthorizedException('Missing x-webhook-signature header');
    }

    this.validateTimestamp(timestamp);

    const secret = this.webhookSecretService.getSecret(input.partner);
    const signedPayload = `${timestamp}.${rawBody}`;

    const expectedSignature = `sha256=${createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex')}`;

    if (!this.safeCompare(expectedSignature, receivedSignature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  private validateTimestamp(timestamp: string) {
    const parsedTimestamp = Number(timestamp);

    if (!Number.isFinite(parsedTimestamp)) {
      throw new UnauthorizedException('Invalid x-webhook-timestamp header');
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const allowedSkew = Number(
      process.env.WEBHOOK_ALLOWED_TIMESTAMP_SKEW_SECONDS ?? 300,
    );

    if (!Number.isFinite(allowedSkew)) {
      throw new BadRequestException(
        'WEBHOOK_ALLOWED_TIMESTAMP_SKEW_SECONDS is invalid',
      );
    }

    const diff = Math.abs(nowInSeconds - parsedTimestamp);

    if (diff > allowedSkew) {
      throw new UnauthorizedException(
        'Webhook timestamp expired or too far from server clock',
      );
    }
  }

  private getHeader(
    headers: Record<string, unknown>,
    headerName: string,
  ): string | null {
    const value = headers[headerName];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }

    return null;
  }

  private safeCompare(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a, 'utf8');
    const bBuffer = Buffer.from(b, 'utf8');

    if (aBuffer.length !== bBuffer.length) {
      return false;
    }

    return timingSafeEqual(aBuffer, bBuffer);
  }
}
