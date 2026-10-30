BEGIN;

ALTER TABLE "identity_and_access_context"."users" ADD COLUMN "is_admin" BOOLEAN NOT NULL DEFAULT false;

-- An admin was a member of the general secretariat whose role said ADMIN: the right now sits beside the role
UPDATE "identity_and_access_context"."users"
SET "is_admin" = true, "role" = 'ADJOINT_SECRETAIRE_GENERAL'
WHERE "role" = 'ADMIN';

CREATE TYPE "identity_and_access_context"."role_new" AS ENUM ('MEMBRE_DU_SIEGE', 'MEMBRE_DU_PARQUET', 'MEMBRE_COMMUN', 'ADJOINT_SECRETAIRE_GENERAL');
ALTER TABLE "identity_and_access_context"."users" ALTER COLUMN "role" TYPE "identity_and_access_context"."role_new" USING ("role"::text::"identity_and_access_context"."role_new");
ALTER TYPE "identity_and_access_context"."role" RENAME TO "role_old";
ALTER TYPE "identity_and_access_context"."role_new" RENAME TO "role";
DROP TYPE "identity_and_access_context"."role_old";

COMMIT;
