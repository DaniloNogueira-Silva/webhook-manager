import type { Partner } from '../../domain/entities/partner.entity';

export const WEBHOOK_SIGNATURE_VALIDATOR_PORT = Symbol(
  'WEBHOOK_SIGNATURE_VALIDATOR_PORT',
);

export type ValidateWebhookSignatureInput = {
  partner: Partner;
  rawBody?: string;
  headers: Record<string, unknown>;
};

export interface WebhookSignatureValidatorPort {
  validate(input: ValidateWebhookSignatureInput): void;
}
