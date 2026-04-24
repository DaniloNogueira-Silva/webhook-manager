import { Injectable } from '@nestjs/common';
import { PartnerConfigService } from '../../services/partner-config.service';
import { Partner } from '../../domain/entities/partner.entity';
import type { PartnerConfigPort } from '../ports/partner-config.port';

type PartnerPersistenceShape = {
  slug: string;
  eventTypePath: string | null;
  externalEventIdPath: string | null;
  signatureHeaderName: string | null;
  authType: string;
  signatureAlgorithm: string | null;
  secret: string | null;
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

@Injectable()
export class PartnerConfigAdapter implements PartnerConfigPort {
  constructor(private readonly partnerConfigService: PartnerConfigService) {}

  async getActivePartnerOrFail(partnerSlug: string): Promise<Partner> {
    const partner = (await this.partnerConfigService.getActivePartnerOrFail(
      partnerSlug,
    )) as PartnerPersistenceShape;

    return new Partner(
      partner.slug,
      partner.eventTypePath,
      partner.externalEventIdPath,
      partner.signatureHeaderName,
      partner.authType,
      partner.signatureAlgorithm,
      partner.secret,
      partner.signaturePrefix,
      partner.timestampHeaderName,
      partner.timestampToleranceSeconds,
      partner.signedPayloadTemplate,
      partner.authHeaderName,
      partner.apiKeyHeaderName,
      partner.apiKeyValue,
      partner.bearerToken,
      partner.basicUsername,
      partner.basicPassword,
    );
  }
}
