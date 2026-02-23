WITH bronze_administrative_position AS (
  SELECT
    (p ->> 'reel')::DOUBLE PRECISION AS rate,
    p ->> 'posad' AS id,
    p ->> 'libelle' AS "label"
  FROM UNNEST($1::JSONB[]) AS p
)

INSERT INTO data_administration_context.administrative_position (id, rate, "label")
SELECT
  id,
  rate,
  "label"
FROM bronze_administrative_position
ON CONFLICT (id) DO UPDATE SET rate = EXCLUDED.rate, "label" = EXCLUDED."label";
