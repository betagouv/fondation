BEGIN;

-- CreateEnum
CREATE TYPE "nominations_context"."user_title_enum" AS ENUM ('PRESIDENT_SIEGE', 'PRESIDENT_PARQUET', 'FIRST_SECRETARY');

-- CreateEnum
CREATE TYPE "nominations_context"."user_duty_enum" AS ENUM ('PRESIDENT', 'SECRETARY', 'OFFICER');

-- AlterTable
ALTER TABLE "identity_and_access_context"."users"
  ADD COLUMN "display_title" TEXT,
  ADD COLUMN "duty" "nominations_context"."user_duty_enum",
  ADD COLUMN "title" "nominations_context"."user_title_enum";

-- CreateIndex
CREATE UNIQUE INDEX "users_title_key" ON "identity_and_access_context"."users"("title");

COMMIT;
