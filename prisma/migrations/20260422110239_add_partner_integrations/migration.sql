-- CreateEnum
CREATE TYPE "PartnerAuthType" AS ENUM ('HMAC', 'NONE');

-- CreateEnum
CREATE TYPE "PartnerSignatureAlgorithm" AS ENUM ('HMAC_SHA256');

-- CreateTable
CREATE TABLE "partner_integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "authType" "PartnerAuthType" NOT NULL DEFAULT 'HMAC',
    "signatureAlgorithm" "PartnerSignatureAlgorithm",
    "secret" TEXT,
    "signatureHeaderName" TEXT,
    "signaturePrefix" TEXT,
    "timestampHeaderName" TEXT,
    "timestampToleranceSeconds" INTEGER,
    "signedPayloadTemplate" TEXT,
    "eventTypePath" TEXT,
    "externalEventIdPath" TEXT,
    "deliveryIdHeaderName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_integrations_slug_key" ON "partner_integrations"("slug");

-- CreateIndex
CREATE INDEX "partner_integrations_slug_idx" ON "partner_integrations"("slug");

-- CreateIndex
CREATE INDEX "partner_integrations_isActive_idx" ON "partner_integrations"("isActive");
