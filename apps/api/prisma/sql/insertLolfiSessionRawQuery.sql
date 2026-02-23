WITH bronze_session AS (
  SELECT
    (s ->> 'num_session')::INT AS id,
    (s ->> 'date_publication')::DATE AS created_at,
    s ->> 'libelle' AS "label"
  FROM UNNEST($1::JSONB[]) AS s
)

INSERT INTO data_administration_context.session (id, "label", created_at)
SELECT id, "label", created_at
FROM bronze_session
ON CONFLICT (id) DO UPDATE SET
  "label" = EXCLUDED."label",
  created_at = EXCLUDED.created_at