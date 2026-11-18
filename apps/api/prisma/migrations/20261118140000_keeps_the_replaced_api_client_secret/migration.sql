-- AlterTable
ALTER TABLE "identity_and_access_context"."api_clients" ADD COLUMN     "previous_secret_expires_at" TIMESTAMP(6),
ADD COLUMN     "previous_secret_hash" VARCHAR;
