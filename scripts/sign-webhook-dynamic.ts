import 'dotenv/config';
import { createHmac } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const partnerSlug = process.argv[2] ?? 'partner-a';
  const payloadFilePath = process.argv[3] ?? 'payload.json';

  const partner = await prisma.partnerIntegration.findUnique({
    where: { slug: partnerSlug },
  });

  if (!partner) {
    throw new Error(`Partner not found: ${partnerSlug}`);
  }

  if (!partner.secret) {
    throw new Error(`Partner has no secret: ${partnerSlug}`);
  }

  const rawBody = '{"id":"evt-300","eventType":"payment.created","amount":150}';

  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signedPayload = (partner.signedPayloadTemplate ?? '{{rawBody}}')
    .replaceAll('{{rawBody}}', rawBody)
    .replaceAll('{{timestamp}}', timestamp);

  const digest = createHmac('sha256', partner.secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  const signature = `${partner.signaturePrefix ?? ''}${digest}`;

  console.log(
    JSON.stringify(
      {
        partner: partner.slug,
        timestampHeaderName: partner.timestampHeaderName,
        signatureHeaderName: partner.signatureHeaderName,
        timestamp,
        signature,
        rawBody,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
