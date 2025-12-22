-- AlterTable
ALTER TABLE "leads" ADD COLUMN "actionable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "leads" ADD COLUMN "actionabilityScore" INTEGER;
ALTER TABLE "leads" ADD COLUMN "primaryOpportunity" TEXT;
