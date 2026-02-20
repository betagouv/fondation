WITH bronze_pause AS (
  SELECT
    (p ->> 'reel')::DOUBLE PRECISION AS rate,
    p ->> 'posad' AS id,
    p ->> 'libelle' AS "label"
  FROM UNNEST($1::JSONB[]) AS p
)

INSERT INTO data_administration_context.pause (id, rate, "label")
SELECT
  id,
  rate,
  "label"
FROM bronze_pause
ON CONFLICT (id) DO UPDATE SET rate = EXCLUDED.rate, "label" = EXCLUDED."label";
