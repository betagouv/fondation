BEGIN;

-- no nomination file had this outcome in production on 2026-10-08
UPDATE "nominations_context"."dossier_de_nomination" SET "outcome" = NULL, "outcome_comment" = NULL WHERE "outcome" = 'ASSESSING';

CREATE TYPE "nominations_context"."nomination_file_outcome_enum_new" AS ENUM ('VALIDATED', 'NON_VALIDATED', 'SUSPENDED', 'REMOVED', 'WITHDRAWN', 'WAITING_DSJ');
ALTER TABLE "nominations_context"."dossier_de_nomination" ALTER COLUMN "outcome" TYPE "nominations_context"."nomination_file_outcome_enum_new" USING ("outcome"::TEXT::"nominations_context"."nomination_file_outcome_enum_new");
ALTER TYPE "nominations_context"."nomination_file_outcome_enum" RENAME TO "nomination_file_outcome_enum_old";
ALTER TYPE "nominations_context"."nomination_file_outcome_enum_new" RENAME TO "nomination_file_outcome_enum";
DROP TYPE "nominations_context"."nomination_file_outcome_enum_old";

COMMIT;
