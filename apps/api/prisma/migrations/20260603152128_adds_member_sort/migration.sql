BEGIN;

-- AlterTable
ALTER TABLE "identity_and_access_context"."users" ADD COLUMN     "sort" SMALLINT NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "docs"."official_report_member" ADD COLUMN "sort" SMALLINT NOT NULL DEFAULT 1000;

ALTER TABLE "docs"."official_report_member" ALTER COLUMN "sort" DROP DEFAULT;


COMMIT;
