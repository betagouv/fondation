-- AlterTable
ALTER TABLE "identity_and_access_context"."api_clients" ADD COLUMN     "previous_secret_expires_at" TIMESTAMP(6),
ADD COLUMN     "previous_secret_hash" VARCHAR;

-- A replaced secret and the end of its validity go together: one without the other would read as no rotation
ALTER TABLE "identity_and_access_context"."api_clients" ADD CONSTRAINT "api_clients_previous_secret_check" CHECK (("previous_secret_hash" IS NULL) = ("previous_secret_expires_at" IS NULL));
