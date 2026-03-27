BEGIN;

-- AlterTable
ALTER TABLE "docs"."agenda"
  ADD COLUMN     "formation" formation,
  ADD COLUMN     "html" TEXT,
  ADD COLUMN     "pdf_file_id" UUID;

UPDATE "docs"."agenda"
  SET "formation" = "s"."formation"
FROM "nominations_context"."session" AS "s"
WHERE "s"."id" = "session_id";

ALTER TABLE "docs"."agenda"
  ALTER COLUMN "formation" SET NOT NULL;

ALTER TABLE "docs"."agenda_nomination_file"
  ADD COLUMN "reporters" TEXT[];

UPDATE "docs"."agenda_nomination_file"
  SET "reporters" = ARRAY[]::TEXT[] WHERE reporters IS NULL;

ALTER TABLE "docs"."agenda_nomination_file"
  ALTER COLUMN "reporters" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_pdf_file_id_fkey" FOREIGN KEY ("pdf_file_id") REFERENCES "files_context"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;