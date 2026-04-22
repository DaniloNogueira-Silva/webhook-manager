import 'dotenv/config';
import { createHmac } from 'node:crypto';

const partner = process.argv[2] ?? 'partner-a';
const payload =
  process.argv[3] ??
  JSON.stringify({
    id: 'evt-100',
    eventType: 'payment.created',
    amount: 150,
  });

const normalizedPartner = partner.trim().toUpperCase().replace(/-/g, '_');
const envKey = `WEBHOOK_${normalizedPartner}_SECRET`;
const secret = process.env[envKey];

if (!secret) {
  throw new Error(`Missing secret for ${envKey}`);
}

const timestamp = Math.floor(Date.now() / 1000).toString();
const signedPayload = `${timestamp}.${payload}`;
const signature = `sha256=${createHmac('sha256', secret)
  .update(signedPayload, 'utf8')
  .digest('hex')}`;

console.log(JSON.stringify({ timestamp, signature, payload }, null, 2));
