BEGIN;

ALTER TABLE "reports_context"."reports" ALTER COLUMN "transparency" SET DATA TYPE text;

ALTER TYPE "public"."transparency" RENAME VALUE 'MARCH_2025' TO 'GRANDE_TRANSPA_DU_21_MARS_2025';

UPDATE "reports_context"."reports"
set "transparency" = 'GRANDE_TRANSPA_DU_21_MARS_2025'
where "transparency" = 'MARCH_2025';
 
ALTER TABLE "reports_context"."reports" ALTER COLUMN "transparency" SET DATA TYPE "public"."transparency" USING "transparency"::"public"."transparency";

COMMIT;