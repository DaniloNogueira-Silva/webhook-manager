import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';

@Injectable()
export class PartnerIntegrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveBySlug(slug: string) {
    return this.prisma.partnerIntegration.findFirst({
      where: {
        slug,
        isActive: true,
      },
    });
  }
}
