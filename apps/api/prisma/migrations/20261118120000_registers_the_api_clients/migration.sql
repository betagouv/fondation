-- CreateTable
CREATE TABLE "identity_and_access_context"."api_clients" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "revoked_at" TIMESTAMP(6),
    "secret_hash" VARCHAR NOT NULL,

    CONSTRAINT "api_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_and_access_context"."api_client_allowed_ips" (
    "client_id" UUID NOT NULL,
    "ip" VARCHAR NOT NULL,

    CONSTRAINT "api_client_allowed_ips_pkey" PRIMARY KEY ("client_id","ip")
);

-- CreateTable
CREATE TABLE "identity_and_access_context"."api_client_scopes" (
    "client_id" UUID NOT NULL,
    "scope" VARCHAR NOT NULL,

    CONSTRAINT "api_client_scopes_pkey" PRIMARY KEY ("client_id","scope")
);

-- CreateTable
CREATE TABLE "identity_and_access_context"."api_access_tokens" (
    "client_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "hash" VARCHAR NOT NULL,

    CONSTRAINT "api_access_tokens_pkey" PRIMARY KEY ("hash")
);

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."api_client_allowed_ips" ADD CONSTRAINT "api_client_allowed_ips_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "identity_and_access_context"."api_clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."api_client_scopes" ADD CONSTRAINT "api_client_scopes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "identity_and_access_context"."api_clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."api_access_tokens" ADD CONSTRAINT "api_access_tokens_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "identity_and_access_context"."api_clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
