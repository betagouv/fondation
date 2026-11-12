-- @param {String} $1:jurisdictionTypeId
-- @param {String} $2:functionId
-- @param {String} $3:search?
-- @param {Boolean} $4:held
-- @param {Boolean} $5:unheld
-- @param {String} $6:sortBy?
-- @param {Boolean} $7:sortDesc
-- @param {Int} $8:offset
-- @param {Int} $9:limit

WITH holder AS (
  SELECT
    m.id,
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
)

-- TypedSQL ignores the LEFT JOIN: the cast types the id as nullable, the names are null whenever it is
SELECT
  j.codejur AS "courtId",
  j.libelle AS "courtLabel",
  h.id::TEXT AS id,
  h.first_name AS "firstName",
  h.installation_date AS "installationDate",
  h.last_name AS "lastName",
  h.married_name AS "marriedName"
FROM data_administration_context.jurisdictions AS j
  LEFT JOIN holder AS h ON h.jurisdiction_id = j.codejur

WHERE (
  j.type_jur = $1::TEXT
  AND (j.date_suppression IS NULL OR j.date_suppression > CURRENT_DATE)
  -- one vector for both, so that "lyon martin" finds the first president of Lyon named Martin. The city
  -- rather than the label, whose words "cour", "d'" and "appel" would match every court
  AND (
    $3::TEXT IS NULL
    OR (COALESCE(h."search", '') || TO_TSVECTOR('unaccent_simple'::REGCONFIG, LOWER(COALESCE(j.ville_jur, ''))))
    @@ TO_TSQUERY('unaccent_simple'::REGCONFIG, $3::TEXT)
  )
  AND (($4::BOOLEAN AND h.id IS NOT NULL) OR ($5::BOOLEAN AND h.id IS NULL))
)

-- by the code, which names the city: the labels start with "d'" or "de" depending on it
ORDER BY
  CASE WHEN $6::TEXT = 'installationDate' AND $7::BOOLEAN THEN h.installation_date END DESC NULLS LAST,
  CASE WHEN $6::TEXT = 'installationDate' AND NOT $7::BOOLEAN THEN h.installation_date END ASC NULLS LAST,
  CASE WHEN $6::TEXT = 'name' AND $7::BOOLEAN THEN h.last_name END DESC NULLS LAST,
  CASE WHEN $6::TEXT = 'name' AND $7::BOOLEAN THEN h.first_name END DESC NULLS LAST,
  CASE WHEN $6::TEXT = 'name' AND NOT $7::BOOLEAN THEN h.last_name END ASC NULLS LAST,
  CASE WHEN $6::TEXT = 'name' AND NOT $7::BOOLEAN THEN h.first_name END ASC NULLS LAST,
  CASE WHEN $6::TEXT = 'court' AND $7::BOOLEAN THEN j.codejur END DESC,
  j.codejur ASC,
  h.id ASC

LIMIT $9::INT OFFSET $8::INT;
