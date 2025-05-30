BEGIN;

ALTER TABLE "data_administration_context"."transparences" 
    DROP CONSTRAINT "transparences_name_formation_unique";
ALTER TABLE "data_administration_context"."transparences" 
    ALTER COLUMN "name" SET DATA TYPE text;

COMMIT;