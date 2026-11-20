-- AlterTable
-- The default only fills the scopes registered before the limits: Prisma keeps none
ALTER TABLE "identity_and_access_context"."api_client_scopes" ADD COLUMN     "limit_per_minute" INTEGER NOT NULL DEFAULT 20;
UPDATE "identity_and_access_context"."api_client_scopes" SET "limit_per_minute" = 300 WHERE "scope" = 'magistrats:status';
ALTER TABLE "identity_and_access_context"."api_client_scopes" ALTER COLUMN "limit_per_minute" DROP DEFAULT;

-- AlterTable
-- The default only fills the clients registered before the limits, as above
ALTER TABLE "identity_and_access_context"."api_clients" ADD COLUMN     "auth_limit_per_minute" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "identity_and_access_context"."api_clients" ALTER COLUMN "auth_limit_per_minute" DROP DEFAULT;

-- CreateTable
CREATE TABLE "identity_and_access_context"."api_rate_counters" (
    "caller" VARCHAR NOT NULL,
    "count" INTEGER NOT NULL,
    "minute" TIMESTAMP(0) NOT NULL,
    "route" VARCHAR NOT NULL,

    CONSTRAINT "api_rate_counters_pkey" PRIMARY KEY ("caller","route","minute")
);
