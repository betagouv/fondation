BEGIN;

CREATE TYPE "identity_and_access_context"."gender" AS ENUM('MALE', 'FEMALE');
ALTER TABLE "identity_and_access_context"."users" ADD COLUMN "gender" "identity_and_access_context"."gender";

COMMIT;