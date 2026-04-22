import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class WebhookSecretService {
  getSecret(partner: string): string {
    const normalizedPartner = partner.trim().toUpperCase().replace(/-/g, '_');
    const envKey = `WEBHOOK_${normalizedPartner}_SECRET`;

    const secret = process.env[envKey];

    if (!secret) {
      throw new BadRequestException(
        `No webhook secret configured for partner=${partner}`,
      );
    }

    return secret;
  }
}
