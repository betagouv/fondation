BEGIN;

-- AlterTable: the only column of the database left in camel case, for want of a @map
ALTER TABLE "docs"."official_report" RENAME COLUMN "updatedAt" TO "updated_at";

COMMIT;
