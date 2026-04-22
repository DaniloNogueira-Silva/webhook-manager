-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'QUEUED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTERED');

-- CreateTable
CREATE TABLE "webhook_raw_events" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalEventId" TEXT,
    "signature" TEXT,
    "headersJson" JSONB NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "lastError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_raw_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_raw_events_source_idx" ON "webhook_raw_events"("source");

-- CreateIndex
CREATE INDEX "webhook_raw_events_eventType_idx" ON "webhook_raw_events"("eventType");

-- CreateIndex
CREATE INDEX "webhook_raw_events_status_idx" ON "webhook_raw_events"("status");

-- CreateIndex
CREATE INDEX "webhook_raw_events_receivedAt_idx" ON "webhook_raw_events"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_raw_events_source_externalEventId_key" ON "webhook_raw_events"("source", "externalEventId");
