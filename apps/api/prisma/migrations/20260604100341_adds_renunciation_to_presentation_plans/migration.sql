BEGIN;

ALTER TABLE "docs"."justice_presentation_plan" ADD COLUMN "has_renunciation" BOOLEAN;

UPDATE docs.justice_presentation_plan SET has_renunciation = TRUE;

ALTER TABLE "docs"."justice_presentation_plan" ALTER COLUMN "has_renunciation" SET NOT NULL;

COMMIT;
