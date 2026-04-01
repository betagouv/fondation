-- AlterTable
ALTER TABLE "docs"."agenda_nomination_file"
  ALTER COLUMN "position" DROP NOT NULL,
  ALTER COLUMN "targeted_position" DROP NOT NULL;
