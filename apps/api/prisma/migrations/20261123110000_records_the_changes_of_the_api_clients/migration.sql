-- CreateEnum
CREATE TYPE "identity_and_access_context"."api_client_change_enum" AS ENUM ('CREATED', 'UPDATED', 'SECRET_ROTATION_STARTED', 'SECRET_ROTATION_ENDED', 'REVOKED');

-- CreateTable
CREATE TABLE "identity_and_access_context"."api_client_changes" (
    "change" "identity_and_access_context"."api_client_change_enum" NOT NULL,
    "changed_at" TIMESTAMP(6) NOT NULL,
    "changed_by" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "previous_secret_valid_until" TIMESTAMP(6),

    CONSTRAINT "api_client_changes_pkey" PRIMARY KEY ("client_id","changed_at")
);

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."api_client_changes" ADD CONSTRAINT "api_client_changes_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."api_client_changes" ADD CONSTRAINT "api_client_changes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "identity_and_access_context"."api_clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
