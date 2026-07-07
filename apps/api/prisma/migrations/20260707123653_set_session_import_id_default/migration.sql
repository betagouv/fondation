-- AlterTable
ALTER TABLE "nominations_context"."session" ALTER COLUMN "session_import_id" SET DEFAULT gen_random_uuid()::text;
