-- CreateEnum
CREATE TYPE "WebhookProcessingAttemptStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "webhook_processing_attempts" (
    "id" TEXT NOT NULL,
    "webhookEventId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "WebhookProcessingAttemptStatus" NOT NULL DEFAULT 'STARTED',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "latencyMs" INTEGER,

    CONSTRAINT "webhook_processing_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_processing_attempts_webhookEventId_idx" ON "webhook_processing_attempts"("webhookEventId");

-- CreateIndex
CREATE INDEX "webhook_processing_attempts_status_idx" ON "webhook_processing_attempts"("status");

-- CreateIndex
CREATE INDEX "webhook_processing_attempts_startedAt_idx" ON "webhook_processing_attempts"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_processing_attempts_webhookEventId_attemptNumber_key" ON "webhook_processing_attempts"("webhookEventId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "webhook_processing_attempts" ADD CONSTRAINT "webhook_processing_attempts_webhookEventId_fkey" FOREIGN KEY ("webhookEventId") REFERENCES "webhook_raw_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
