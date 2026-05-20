BEGIN;

ALTER TABLE "docs"."justice_presentation_plan_nomination_file"
  ADD COLUMN "agenda_id" UUID;

UPDATE "docs"."justice_presentation_plan_nomination_file" npf
SET "agenda_id" = pta."agenda_id"
FROM "docs"."justice_presentation_plan_to_agenda" pta
WHERE pta."plan_id" = npf."plan_id";

DELETE FROM "docs"."justice_presentation_plan_nomination_file" WHERE "agenda_id" IS NULL;

ALTER TABLE "docs"."justice_presentation_plan_nomination_file"
  ALTER COLUMN "agenda_id" SET NOT NULL;

ALTER TABLE "docs"."justice_presentation_plan_nomination_file"
  ADD CONSTRAINT "justice_presentation_plan_nomination_file_agenda_id_fkey" FOREIGN KEY ("agenda_id")
  REFERENCES "docs"."agenda"("id")
    ON DELETE RESTRICT
    ON UPDATE NO ACTION;

COMMIT;
