BEGIN;

UPDATE "nominations_context"."session" AS s
SET "name" = 'PG/PR'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'PROCUREURS_GENERAUX_8_NOVEMBRE_2024';

UPDATE "nominations_context"."session" AS s
SET "name" = 'PG'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'PROCUREURS_GENERAUX_25_NOVEMBRE_2024';

UPDATE "nominations_context"."session" AS s
SET "name" = 'Mamoudzou'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024';

UPDATE "nominations_context"."session" AS s
SET "name" = 'cabinet GDS'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'CABINET_DU_MINISTRE_DU_21_JANVIER_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = 'siège'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'SIEGE_DU_06_FEVRIER_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = 'parquet'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'PARQUET_DU_06_FEVRIER_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = 'parquet'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'PARQUET_DU_20_FEVRIER_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = '3 mars 2025'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'DU_03_MARS_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = 'annuelle'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'GRANDE_TRANSPA_DU_21_MARS_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = '30 avril 2025'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'DU_30_AVRIL_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = 'mars 2026'
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'MARCH_2026';

COMMIT;