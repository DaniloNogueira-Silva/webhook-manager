-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PartnerAuthType" ADD VALUE 'BEARER_TOKEN';
ALTER TYPE "PartnerAuthType" ADD VALUE 'BASIC';
ALTER TYPE "PartnerAuthType" ADD VALUE 'API_KEY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PartnerSignatureAlgorithm" ADD VALUE 'HMAC_SHA1';
ALTER TYPE "PartnerSignatureAlgorithm" ADD VALUE 'HMAC_SHA384';
ALTER TYPE "PartnerSignatureAlgorithm" ADD VALUE 'HMAC_SHA512';

-- DropIndex
DROP INDEX "partner_integrations_slug_idx";

-- AlterTable
ALTER TABLE "partner_integrations" ADD COLUMN     "apiKeyHeaderName" TEXT,
ADD COLUMN     "apiKeyValue" TEXT,
ADD COLUMN     "authHeaderName" TEXT,
ADD COLUMN     "basicPassword" TEXT,
ADD COLUMN     "basicUsername" TEXT,
ADD COLUMN     "bearerToken" TEXT;
