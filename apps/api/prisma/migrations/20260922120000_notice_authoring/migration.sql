BEGIN;

-- author_id held whoever saved the notice last, so it is the closest thing the base has to its author
ALTER TABLE "docs"."justice_presentation_plan"
    RENAME COLUMN "author_id" TO "created_by";

ALTER TABLE "docs"."justice_presentation_plan"
    RENAME CONSTRAINT "justice_presentation_plan_author_id_fkey" TO "justice_presentation_plan_created_by_fkey";

ALTER TABLE "docs"."justice_presentation_plan"
    ADD COLUMN "updated_by" UUID,
    ADD CONSTRAINT "justice_presentation_plan_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- updated_at used to move on its own, when the application cached the html or the pdf nobody asked for:
-- its stored values answer another question, so they are dropped rather than passed off as an edition
ALTER TABLE "docs"."justice_presentation_plan"
    ALTER COLUMN "updated_at" DROP NOT NULL;

UPDATE "docs"."justice_presentation_plan" SET "updated_at" = NULL;

COMMIT;
