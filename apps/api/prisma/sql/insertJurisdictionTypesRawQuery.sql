WITH bronze_jurisdiction_type AS (
  SELECT
    (t ->> 'tri')::INT AS "sort",
    t ->> 'type_jur' AS id,
    t ->> 'libelle' AS "label"
  FROM UNNEST($1::JSONB[]) AS t
)

INSERT INTO data_administration_context.jurisdiction_type (id, "label", "sort")
SELECT id, "label", "sort"
FROM bronze_jurisdiction_type
ON CONFLICT (id) DO UPDATE SET
  "label" = EXCLUDED."label",
  "sort" = EXCLUDED."sort";
