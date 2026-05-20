BEGIN;

-- AlterTable: Agenda
ALTER TABLE "docs"."agenda"
  ADD COLUMN "is_manually_edited" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: OfficialReport
ALTER TABLE "docs"."official_report"
  ADD COLUMN "is_manually_edited" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: JusticePresentationPlan
ALTER TABLE "docs"."justice_presentation_plan"
  ADD COLUMN "is_manually_edited" BOOLEAN NOT NULL DEFAULT false;

COMMIT;