import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, WebhookEventStatus } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const event = await prisma.webhookRawEvent.create({
    data: {
      source: 'manual-test',
      eventType: 'test.created',
      externalEventId: `evt-${Date.now()}`,
      signature: 'test-signature',
      headersJson: {
        'x-test-header': 'ok',
      },
      payloadJson: {
        message: 'hello world',
      },
      status: WebhookEventStatus.RECEIVED,
    },
  });

  console.log('Inserted event:', event);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
