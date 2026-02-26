BEGIN;

-- AlterEnum
ALTER TYPE "identity_and_access_context"."role" ADD VALUE 'ADMIN';

COMMIT;
