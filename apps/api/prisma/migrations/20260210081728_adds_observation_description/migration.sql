BEGIN;
-- AlterTable
ALTER TABLE "nominations_context"."observation" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '';
COMMIT;
