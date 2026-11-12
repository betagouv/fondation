-- @param {String} $1:jurisdictionTypeId
-- @param {String} $2:functionId
-- @param {String} $3:search?

WITH holder AS (
  SELECT DISTINCT ON (p.jurisdiction_id)
    m.id,
    m."search",
    p.jurisdiction_id
  FROM data_administration_context.magistrat AS m
    INNER JOIN data_administration_context."position" AS p
      ON p.id = NULLIF(m.current_position_id, '')::INT
  WHERE m.status = 'ACTIVE' AND p.function_id = $2::TEXT
  -- one row per court: during a handover, the latest installed
  ORDER BY p.jurisdiction_id, m.installation_date DESC NULLS LAST, m.id
)

SELECT
  h.id IS NOT NULL AS held,
  COUNT(*) AS seats
FROM data_administration_context.jurisdictions AS j
  LEFT JOIN holder AS h ON h.jurisdiction_id = j.codejur

WHERE (
  j.type_jur = $1::TEXT
  AND (j.date_suppression IS NULL OR j.date_suppression > CURRENT_DATE)
  -- one vector for all, so that "lyon martin" finds the first president of Lyon named Martin. The city
  -- is hyphenated too, so that "aix-en-provence" finds "AIX EN PROVENCE"
  AND (
    $3::TEXT IS NULL
    OR (
      COALESCE(h."search", '')
      || TO_TSVECTOR('unaccent_simple'::REGCONFIG, LOWER(COALESCE(j.libelle, '')))
      || TO_TSVECTOR('unaccent_simple'::REGCONFIG, LOWER(REPLACE(COALESCE(j.ville_jur, ''), ' ', '-')))
    ) @@ TO_TSQUERY('unaccent_simple'::REGCONFIG, $3::TEXT)
  )
)

GROUP BY 1;
