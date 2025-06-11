-- Custom SQL migration file, put you code below! --
BEGIN;

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2024, 'month', 10, 'day', 18),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'AUTOMNE_2024';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2024, 'month', 11, 'day', 8),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'PROCUREURS_GENERAUX_8_NOVEMBRE_2024';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2024, 'month', 11, 'day', 25),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'PROCUREURS_GENERAUX_25_NOVEMBRE_2024';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2024, 'month', 11, 'day', 25),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2025, 'month', 1, 'day', 21),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'CABINET_DU_MINISTRE_DU_21_JANVIER_2025';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2025, 'month', 2, 'day', 6),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'SIEGE_DU_06_FEVRIER_2025';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2025, 'month', 2, 'day', 6),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'PARQUET_DU_06_FEVRIER_2025';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2025, 'month', 2, 'day', 20),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'PARQUET_DU_20_FEVRIER_2025';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2025, 'month', 3, 'day', 3),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'DU_03_MARS_2025';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2025, 'month', 3, 'day', 21),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'GRANDE_TRANSPA_DU_21_MARS_2025';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2025, 'month', 4, 'day', 30),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'DU_30_AVRIL_2025';

UPDATE "nominations_context"."session" AS s
SET "content" = jsonb_build_object(
    'dateTransparence', jsonb_build_object('year', 2026, 'month', 3, 'day', 1),
    'dateClôtureDélaiObservation', jsonb_build_object('year', 2025, 'month', 1, 'day', 1)
)
FROM "data_administration_context"."transparences" AS t
WHERE t."name" = 'MARCH_2026';

COMMIT;