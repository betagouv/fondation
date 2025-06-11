BEGIN;

ALTER TABLE "data_administration_context"."transparences" RENAME COLUMN "date_emission_gds" TO "date_transparence";
ALTER TABLE "data_administration_context"."transparences" ALTER COLUMN "date_transparence" SET NOT NULL;
ALTER TABLE "data_administration_context"."transparences" ALTER COLUMN "date_cloture_delai_observation" SET NOT NULL;
ALTER TABLE "data_administration_context"."transparences" ADD CONSTRAINT "transparences_name_formation_date_transparence_unique" UNIQUE("name","formation","date_transparence");

COMMIT;