import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PartnerAuthType,
  PartnerSignatureAlgorithm,
  PrismaClient,
} from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  await prisma.partnerIntegration.upsert({
    where: { slug: 'partner-hmac' },
    update: {
      name: 'Partner HMAC',
      isActive: true,
      authType: PartnerAuthType.HMAC,
      signatureAlgorithm: PartnerSignatureAlgorithm.HMAC_SHA256,
      secret: 'partner-hmac-super-secret',
      signatureHeaderName: 'x-webhook-signature',
      signaturePrefix: 'sha256=',
      timestampHeaderName: 'x-webhook-timestamp',
      timestampToleranceSeconds: 300,
      signedPayloadTemplate: '{{timestamp}}.{{rawBody}}',

      authHeaderName: null,
      bearerToken: null,
      apiKeyHeaderName: null,
      apiKeyValue: null,
      basicUsername: null,
      basicPassword: null,

      eventTypePath: 'eventType',
      externalEventIdPath: 'id',
      deliveryIdHeaderName: 'x-delivery-id',
    },
    create: {
      slug: 'partner-hmac',
      name: 'Partner HMAC',
      isActive: true,
      authType: PartnerAuthType.HMAC,
      signatureAlgorithm: PartnerSignatureAlgorithm.HMAC_SHA256,
      secret: 'partner-hmac-super-secret',
      signatureHeaderName: 'x-webhook-signature',
      signaturePrefix: 'sha256=',
      timestampHeaderName: 'x-webhook-timestamp',
      timestampToleranceSeconds: 300,
      signedPayloadTemplate: '{{timestamp}}.{{rawBody}}',

      authHeaderName: null,
      bearerToken: null,
      apiKeyHeaderName: null,
      apiKeyValue: null,
      basicUsername: null,
      basicPassword: null,

      eventTypePath: 'eventType',
      externalEventIdPath: 'id',
      deliveryIdHeaderName: 'x-delivery-id',
    },
  });

  await prisma.partnerIntegration.upsert({
    where: { slug: 'partner-bearer' },
    update: {
      name: 'Partner Bearer',
      isActive: true,
      authType: PartnerAuthType.BEARER_TOKEN,
      signatureAlgorithm: null,
      secret: null,
      signatureHeaderName: null,
      signaturePrefix: null,
      timestampHeaderName: null,
      timestampToleranceSeconds: null,
      signedPayloadTemplate: null,

      authHeaderName: 'authorization',
      bearerToken: 'partner-bearer-token-123',
      apiKeyHeaderName: null,
      apiKeyValue: null,
      basicUsername: null,
      basicPassword: null,

      eventTypePath: 'type',
      externalEventIdPath: 'eventId',
      deliveryIdHeaderName: 'x-delivery-id',
    },
    create: {
      slug: 'partner-bearer',
      name: 'Partner Bearer',
      isActive: true,
      authType: PartnerAuthType.BEARER_TOKEN,
      signatureAlgorithm: null,
      secret: null,
      signatureHeaderName: null,
      signaturePrefix: null,
      timestampHeaderName: null,
      timestampToleranceSeconds: null,
      signedPayloadTemplate: null,

      authHeaderName: 'authorization',
      bearerToken: 'partner-bearer-token-123',
      apiKeyHeaderName: null,
      apiKeyValue: null,
      basicUsername: null,
      basicPassword: null,

      eventTypePath: 'type',
      externalEventIdPath: 'eventId',
      deliveryIdHeaderName: 'x-delivery-id',
    },
  });

  await prisma.partnerIntegration.upsert({
    where: { slug: 'partner-basic' },
    update: {
      name: 'Partner Basic',
      isActive: true,
      authType: PartnerAuthType.BASIC,
      signatureAlgorithm: null,
      secret: null,
      signatureHeaderName: null,
      signaturePrefix: null,
      timestampHeaderName: null,
      timestampToleranceSeconds: null,
      signedPayloadTemplate: null,

      authHeaderName: 'authorization',
      bearerToken: null,
      apiKeyHeaderName: null,
      apiKeyValue: null,
      basicUsername: 'partner-basic-user',
      basicPassword: 'partner-basic-pass',

      eventTypePath: 'event.type',
      externalEventIdPath: 'event.id',
      deliveryIdHeaderName: 'x-delivery-id',
    },
    create: {
      slug: 'partner-basic',
      name: 'Partner Basic',
      isActive: true,
      authType: PartnerAuthType.BASIC,
      signatureAlgorithm: null,
      secret: null,
      signatureHeaderName: null,
      signaturePrefix: null,
      timestampHeaderName: null,
      timestampToleranceSeconds: null,
      signedPayloadTemplate: null,

      authHeaderName: 'authorization',
      bearerToken: null,
      apiKeyHeaderName: null,
      apiKeyValue: null,
      basicUsername: 'partner-basic-user',
      basicPassword: 'partner-basic-pass',

      eventTypePath: 'event.type',
      externalEventIdPath: 'event.id',
      deliveryIdHeaderName: 'x-delivery-id',
    },
  });

  await prisma.partnerIntegration.upsert({
    where: { slug: 'partner-api-key' },
    update: {
      name: 'Partner API Key',
      isActive: true,
      authType: PartnerAuthType.API_KEY,
      signatureAlgorithm: null,
      secret: null,
      signatureHeaderName: null,
      signaturePrefix: null,
      timestampHeaderName: null,
      timestampToleranceSeconds: null,
      signedPayloadTemplate: null,

      authHeaderName: null,
      bearerToken: null,
      apiKeyHeaderName: 'x-api-key',
      apiKeyValue: 'partner-api-key-secret',
      basicUsername: null,
      basicPassword: null,

      eventTypePath: 'data.type',
      externalEventIdPath: 'data.id',
      deliveryIdHeaderName: 'x-delivery-id',
    },
    create: {
      slug: 'partner-api-key',
      name: 'Partner API Key',
      isActive: true,
      authType: PartnerAuthType.API_KEY,
      signatureAlgorithm: null,
      secret: null,
      signatureHeaderName: null,
      signaturePrefix: null,
      timestampHeaderName: null,
      timestampToleranceSeconds: null,
      signedPayloadTemplate: null,

      authHeaderName: null,
      bearerToken: null,
      apiKeyHeaderName: 'x-api-key',
      apiKeyValue: 'partner-api-key-secret',
      basicUsername: null,
      basicPassword: null,

      eventTypePath: 'data.type',
      externalEventIdPath: 'data.id',
      deliveryIdHeaderName: 'x-delivery-id',
    },
  });

  console.log('Partners seeded successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
