-- CreateTable
CREATE TABLE "identity_and_access_context"."impersonation" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "sessionId" UUID NOT NULL,
    "impersonated_user_id" UUID NOT NULL,

    CONSTRAINT "impersonation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."impersonation"
    ADD CONSTRAINT "impersonation_sessionId_fkey" FOREIGN KEY ("sessionId")
    REFERENCES "identity_and_access_context"."sessions"("session_id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."impersonation"
    ADD CONSTRAINT "impersonation_impersonated_user_id_fkey" FOREIGN KEY ("impersonated_user_id")
    REFERENCES "identity_and_access_context"."users"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
