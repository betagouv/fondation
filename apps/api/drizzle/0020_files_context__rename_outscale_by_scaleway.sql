BEGIN;

ALTER TABLE "files_context"."files" ALTER COLUMN "storage_provider" SET DATA TYPE text;
DROP TYPE "files_context"."storage_provider";
CREATE TYPE "files_context"."storage_provider" AS ENUM('SCALEWAY');
ALTER TABLE "files_context"."files" ALTER COLUMN "storage_provider" SET DATA TYPE "files_context"."storage_provider" USING "storage_provider"::"files_context"."storage_provider";

COMMIT;