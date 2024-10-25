BEGIN;

ALTER TABLE "reports_context"."reports" ALTER COLUMN "transparency" SET DATA TYPE text;
DROP TYPE "public"."transparency";
CREATE TYPE "public"."transparency" AS ENUM('AUTOMNE_2024', 'MARCH_2025', 'MARCH_2026');
ALTER TABLE "reports_context"."reports" ALTER COLUMN "transparency" SET DATA TYPE "public"."transparency" USING "transparency"::"public"."transparency";

COMMIT;