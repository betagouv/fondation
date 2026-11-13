-- @param {String} $1:jurisdictionTypeId
-- @param {String} $2:functionId
-- @param {String} $3:search?
-- @param {String} $4:sortBy?
-- @param {Boolean} $5:sortDesc

WITH holder AS (
  SELECT DISTINCT ON (p.jurisdiction_id)
    m.id,
    m.birth_date,
    m.first_name,
    m.installation_date,
    m.last_name,
    m.married_name,
    m."search",
    p.jurisdiction_id
  FROM data_administration_context.magistrat AS m
    INNER JOIN data_administration_context."position" AS p
      ON p.id = NULLIF(m.current_position_id, '')::INT
  WHERE m.status = 'ACTIVE' AND p.function_id = $2::TEXT
  -- one row per court: during a handover, the latest nominated, whose installation date can still be missing
  ORDER BY p.jurisdiction_id, m.nomination_date DESC NULLS LAST, m.installation_date DESC NULLS LAST, m.id
)

-- TypedSQL ignores the LEFT JOIN: the cast types the id as nullable, the names are null whenever it is
SELECT
  j.codejur AS "courtId",
  j.libelle AS "courtLabel",
  -- one vector for all, so that "lyon martin" finds the president of Lyon named Martin, and "lyon" every
  -- court of its ressort. The cities are hyphenated too, so that "aix-en-provence" finds "AIX EN PROVENCE".
  -- Returned rather than filtered, so that every ressort stays in its filter
  (
    $3::TEXT IS NULL
    OR (
      COALESCE(h."search", '')
      || TO_TSVECTOR('unaccent_simple'::REGCONFIG, LOWER(COALESCE(j.libelle, '')))
      || TO_TSVECTOR('unaccent_simple'::REGCONFIG, LOWER(REPLACE(COALESCE(j.ville_jur, ''), ' ', '-')))
      || TO_TSVECTOR('unaccent_simple'::REGCONFIG, LOWER(COALESCE(r.libelle, '')))
      || TO_TSVECTOR('unaccent_simple'::REGCONFIG, LOWER(REPLACE(COALESCE(r.ville_jur, ''), ' ', '-')))
    ) @@ TO_TSQUERY('unaccent_simple'::REGCONFIG, $3::TEXT)
  ) AS "matchesSearch",
  r.codejur AS "ressortId",
  r.libelle AS "ressortLabel",
  h.id::TEXT AS id,
  h.birth_date AS "birthDate",
  h.first_name AS "firstName",
  h.installation_date AS "installationDate",
  h.last_name AS "lastName",
  h.married_name AS "marriedName"
FROM data_administration_context.jurisdictions AS j
  INNER JOIN data_administration_context.jurisdictions AS r ON r.codejur = j.ressort
  LEFT JOIN holder AS h ON h.jurisdiction_id = j.codejur

WHERE (
  j.type_jur = $1::TEXT
  AND (j.date_suppression IS NULL OR j.date_suppression > CURRENT_DATE)
)

-- by the codes, which name the cities: the labels start with "d'" or "de" depending on them
ORDER BY
  CASE WHEN $4::TEXT = 'installationDate' AND $5::BOOLEAN THEN h.installation_date END DESC NULLS LAST,
  CASE WHEN $4::TEXT = 'installationDate' AND NOT $5::BOOLEAN THEN h.installation_date END ASC NULLS LAST,
  CASE WHEN $4::TEXT = 'name' AND $5::BOOLEAN THEN h.last_name END DESC NULLS LAST,
  CASE WHEN $4::TEXT = 'name' AND $5::BOOLEAN THEN h.first_name END DESC NULLS LAST,
  CASE WHEN $4::TEXT = 'name' AND NOT $5::BOOLEAN THEN h.last_name END ASC NULLS LAST,
  CASE WHEN $4::TEXT = 'name' AND NOT $5::BOOLEAN THEN h.first_name END ASC NULLS LAST,
  CASE WHEN $4::TEXT = 'court' AND $5::BOOLEAN THEN j.codejur END DESC,
  CASE WHEN $4::TEXT = 'court' AND NOT $5::BOOLEAN THEN j.codejur END ASC,
  CASE WHEN $4::TEXT = 'ressort' AND $5::BOOLEAN THEN r.codejur END DESC,
  r.codejur ASC,
  j.codejur ASC,
  h.id ASC;
