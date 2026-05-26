BEGIN;

-- AlterTable
ALTER TABLE "docs"."official_report_member" ADD COLUMN "is_absent" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "docs"."official_report_member" ALTER COLUMN "is_absent" DROP DEFAULT;

COMMIT;
