BEGIN;

-- AlterTable
ALTER TABLE "nominations_context"."session"
    ADD COLUMN     "is_validated" BOOLEAN,
    ADD COLUMN     "lolfi_session_id" INTEGER,
    ADD COLUMN     "validated_at" TIMESTAMP(3),
    ADD COLUMN     "validated_by" UUID;

-- CreateTable
CREATE TABLE "nominations_context"."session_indicator" (
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_indicator_pkey" PRIMARY KEY ("session_id","user_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."session" ADD CONSTRAINT "session_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."session_indicator" ADD CONSTRAINT "session_indicator_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

UPDATE "nominations_context"."session" SET "is_validated" = TRUE;
ALTER TABLE "nominations_context"."session"
    ALTER COLUMN "is_validated" SET NOT NULL,
    ALTER COLUMN "is_validated" SET DEFAULT FALSE;

COMMIT;
