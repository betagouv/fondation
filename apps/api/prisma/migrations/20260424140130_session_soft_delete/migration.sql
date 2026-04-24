BEGIN;

-- AlterTable
ALTER TABLE "nominations_context"."session"
  ADD COLUMN "deleted_at" TIMESTAMP(3),
  ADD COLUMN "deleted_by" UUID;

-- CreateIndex
CREATE INDEX "session_deleted_at_idx" ON "nominations_context"."session"("deleted_at");

-- AddForeignKey
ALTER TABLE "nominations_context"."session"
  ADD CONSTRAINT "session_deleted_by_fkey"
  FOREIGN KEY ("deleted_by")
    REFERENCES "identity_and_access_context"."users"("id")
  ON DELETE SET NULL
  ON UPDATE NO ACTION;

COMMIT;

