BEGIN;

-- AlterTable
ALTER TABLE "docs"."agenda" ADD COLUMN "html_outdated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "docs"."agenda_nomination_file"
  ADD COLUMN "html_edited" TEXT,
  ADD COLUMN "html_outdated" BOOLEAN NOT NULL DEFAULT false;

COMMIT;
