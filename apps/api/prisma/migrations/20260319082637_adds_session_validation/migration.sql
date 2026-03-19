BEGIN;

-- AlterTable
ALTER TABLE "nominations_context"."session"
    ADD COLUMN     "is_validated" BOOLEAN,
    ADD COLUMN     "lolfi_session_id" INTEGER,
    ADD COLUMN     "validated_at" TIMESTAMP(3),
    ADD COLUMN     "validated_by" UUID;

-- AddForeignKey
ALTER TABLE "nominations_context"."session" ADD CONSTRAINT "session_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

UPDATE "nominations_context"."session" SET "is_validated" = TRUE;
ALTER TABLE "nominations_context"."session"
    ALTER COLUMN "is_validated" SET NOT NULL,
    ALTER COLUMN "is_validated" SET DEFAULT FALSE;

COMMIT;
