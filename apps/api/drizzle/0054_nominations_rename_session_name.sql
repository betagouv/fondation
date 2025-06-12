BEGIN;

UPDATE "nominations_context"."session" AS s
SET "name" = 'PG/PR'
WHERE s."name" = 'PROCUREURS_GENERAUX_8_NOVEMBRE_2024';

UPDATE "nominations_context"."session" AS s
SET "name" = 'PG'
WHERE s."name" = 'PROCUREURS_GENERAUX_25_NOVEMBRE_2024';

UPDATE "nominations_context"."session" AS s
SET "name" = 'Mamoudzou'
WHERE s."name" = 'TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024';

UPDATE "nominations_context"."session" AS s
SET "name" = 'cabinet GDS'
WHERE s."name" = 'CABINET_DU_MINISTRE_DU_21_JANVIER_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = 'siège'
WHERE s."name" = 'SIEGE_DU_06_FEVRIER_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = 'parquet'
WHERE s."name" = 'PARQUET_DU_06_FEVRIER_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = 'parquet'
WHERE s."name" = 'PARQUET_DU_20_FEVRIER_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = '3 mars 2025'
WHERE s."name" = 'DU_03_MARS_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = 'annuelle'
WHERE s."name" = 'GRANDE_TRANSPA_DU_21_MARS_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = '30 avril 2025'
WHERE s."name" = 'DU_30_AVRIL_2025';

UPDATE "nominations_context"."session" AS s
SET "name" = 'mars 2026'
WHERE s."name" = 'MARCH_2026';

COMMIT;