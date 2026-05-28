BEGIN;

-- AlterTable
ALTER TABLE "nominations_context"."session"
  ADD COLUMN "archived_at" TIMESTAMP(3),
  ADD COLUMN "archived_by" UUID;

-- CreateIndex
CREATE INDEX "session_archived_at_idx" ON "nominations_context"."session"("archived_at");

-- AddForeignKey
ALTER TABLE "nominations_context"."session"
  ADD CONSTRAINT "session_archived_by_fkey"
  FOREIGN KEY ("archived_by")
    REFERENCES "identity_and_access_context"."users"("id")
  ON DELETE SET NULL
  ON UPDATE NO ACTION;

COMMIT;
