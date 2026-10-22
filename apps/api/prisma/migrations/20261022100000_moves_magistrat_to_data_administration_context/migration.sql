BEGIN;

-- Written by hand: Prisma would drop then recreate the table, losing the magistrats and, by cascade,
-- their candidacies, observations and auditions
ALTER TYPE "nominations_context"."magistrat_status_enum" SET SCHEMA "data_administration_context";
ALTER TABLE "nominations_context"."magistrat" SET SCHEMA "data_administration_context";

COMMIT;
