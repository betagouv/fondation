-- CreateTable
CREATE TABLE "identity_and_access_context"."openid_request" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "nonce" BYTEA NOT NULL,
    "challenge" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openid_request_pkey" PRIMARY KEY ("provider","id")
);
