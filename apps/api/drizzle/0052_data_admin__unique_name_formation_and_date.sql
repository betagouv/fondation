BEGIN;

ALTER TABLE "data_administration_context"."transparences" RENAME COLUMN "date_emission_gds" TO "date_transparence";

UPDATE "data_administration_context"."transparences" 
    SET "date_transparence" = '2024-10-01'::timestamp
    WHERE "name" = 'AUTOMNE_2024';

UPDATE "data_administration_context"."transparences" 
    SET "date_transparence" = '2024-11-08'::timestamp
    WHERE "name" = 'PROCUREURS_GENERAUX_8_NOVEMBRE_2024';

UPDATE "data_administration_context"."transparences" 
    SET "date_transparence" = '2024-11-25'::timestamp
    WHERE "name" IN ('PROCUREURS_GENERAUX_25_NOVEMBRE_2024', 'TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024');

UPDATE "data_administration_context"."transparences" 
    SET "date_transparence" = '2025-01-21'::timestamp
    WHERE "name" = 'CABINET_DU_MINISTRE_DU_21_JANVIER_2025';

UPDATE "data_administration_context"."transparences" 
    SET "date_transparence" = '2025-02-06'::timestamp
    WHERE "name" IN ('SIEGE_DU_06_FEVRIER_2025', 'PARQUET_DU_06_FEVRIER_2025');

UPDATE "data_administration_context"."transparences" 
    SET "date_transparence" = '2025-02-20'::timestamp
    WHERE "name" = 'PARQUET_DU_20_FEVRIER_2025';

UPDATE "data_administration_context"."transparences" 
    SET "date_transparence" = '2025-03-03'::timestamp
    WHERE "name" = 'DU_03_MARS_2025';

UPDATE "data_administration_context"."transparences" 
    SET "date_transparence" = '2025-03-21'::timestamp
    WHERE "name" = 'GRANDE_TRANSPA_DU_21_MARS_2025';

UPDATE "data_administration_context"."transparences" 
    SET "date_transparence" = '2025-04-30'::timestamp
    WHERE "name" = 'DU_30_AVRIL_2025';

UPDATE "data_administration_context"."transparences" 
    SET "date_transparence" = '2026-03-01'::timestamp
    WHERE "name" = 'MARCH_2026';

UPDATE "data_administration_context"."transparences" 
    SET "date_cloture_delai_observation" = '2025-01-01'::timestamp
    WHERE "date_cloture_delai_observation" IS NULL;

ALTER TABLE "data_administration_context"."transparences" ALTER COLUMN "date_transparence" SET NOT NULL;
ALTER TABLE "data_administration_context"."transparences" ALTER COLUMN "date_cloture_delai_observation" SET NOT NULL;
ALTER TABLE "data_administration_context"."transparences" ADD CONSTRAINT "transparences_name_formation_date_transparence_unique" UNIQUE("name","formation","date_transparence");

COMMIT;