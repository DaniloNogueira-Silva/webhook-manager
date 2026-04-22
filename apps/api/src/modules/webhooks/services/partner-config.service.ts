import { Injectable, NotFoundException } from '@nestjs/common';
import { PartnerIntegrationsRepository } from '../repositories/partner-integrations.repository';

@Injectable()
export class PartnerConfigService {
  constructor(
    private readonly partnerIntegrationsRepository: PartnerIntegrationsRepository,
  ) {}

  async getActivePartnerOrFail(partnerSlug: string) {
    const partner =
      await this.partnerIntegrationsRepository.findActiveBySlug(partnerSlug);

    if (!partner) {
      throw new NotFoundException(
        `Partner not found or inactive: ${partnerSlug}`,
      );
    }

    return partner;
  }
}
