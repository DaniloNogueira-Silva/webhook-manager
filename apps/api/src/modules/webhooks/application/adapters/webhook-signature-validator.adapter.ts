import { Injectable } from '@nestjs/common';
import { WebhookSignatureValidatorService } from '../../services/webhook-signature-validator.service';
import type { WebhookSignatureValidatorPort } from '../ports/webhook-signature-validator.port';

@Injectable()
export class WebhookSignatureValidatorAdapter implements WebhookSignatureValidatorPort {
  constructor(
    private readonly webhookSignatureValidatorService: WebhookSignatureValidatorService,
  ) {}

  validate(input: {
    partner: {
      authType: string;
      signatureAlgorithm: string | null;
      secret: string | null;
      signatureHeaderName: string | null;
      signaturePrefix: string | null;
      timestampHeaderName: string | null;
      timestampToleranceSeconds: number | null;
      signedPayloadTemplate: string | null;
      authHeaderName?: string | null;
      apiKeyHeaderName?: string | null;
      apiKeyValue?: string | null;
      bearerToken?: string | null;
      basicUsername?: string | null;
      basicPassword?: string | null;
    };
    rawBody?: string;
    headers: Record<string, unknown>;
  }): void {
    this.webhookSignatureValidatorService.validate({
      partner: {
        authType: input.partner.authType as never,
        signatureAlgorithm: input.partner.signatureAlgorithm as never,
        secret: input.partner.secret,
        signatureHeaderName: input.partner.signatureHeaderName,
        signaturePrefix: input.partner.signaturePrefix,
        timestampHeaderName: input.partner.timestampHeaderName,
        timestampToleranceSeconds: input.partner.timestampToleranceSeconds,
        signedPayloadTemplate: input.partner.signedPayloadTemplate,
        authHeaderName: input.partner.authHeaderName,
        apiKeyHeaderName: input.partner.apiKeyHeaderName,
        apiKeyValue: input.partner.apiKeyValue,
        bearerToken: input.partner.bearerToken,
        basicUsername: input.partner.basicUsername,
        basicPassword: input.partner.basicPassword,
      },
      rawBody: input.rawBody,
      headers: input.headers,
    });
  }
}
