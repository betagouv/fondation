BEGIN;

-- AlterTable
ALTER TABLE "docs"."official_report" ADD COLUMN "validated_at" TIMESTAMP(3);

-- a stored PDF used to stand for a validation: keep the propositions on the status they show today
UPDATE "docs"."official_report" SET "validated_at" = "updatedAt" WHERE "pdf_id" IS NOT NULL;

COMMIT;
