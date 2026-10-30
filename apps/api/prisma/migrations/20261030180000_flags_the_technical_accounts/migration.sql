ALTER TABLE "identity_and_access_context"."users" ADD COLUMN "is_technical" BOOLEAN NOT NULL DEFAULT false;

-- Until the flag, the beta.gouv.fr team held secretariat accounts like any agent of the general secretariat
UPDATE "identity_and_access_context"."users"
SET "is_technical" = true
WHERE "email" ILIKE '%@beta.gouv.fr' AND "role" = 'ADJOINT_SECRETAIRE_GENERAL';
