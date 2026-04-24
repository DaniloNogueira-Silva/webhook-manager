import type { Partner } from '../../domain/entities/partner.entity';

export const PARTNER_CONFIG_PORT = Symbol('PARTNER_CONFIG_PORT');

export interface PartnerConfigPort {
  getActivePartnerOrFail(partnerSlug: string): Promise<Partner>;
}
