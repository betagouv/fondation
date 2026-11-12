-- @param {String} $1:jurisdictionId
-- @param $2:functionIds
-- @param $3:gradeIds
-- @param $4:ranks
-- @param {String} $5:search?
-- @param {String} $6:sortBy?
-- @param {Boolean} $7:sortDesc
-- @param {Int} $8:offset
-- @param {Int} $9:limit

-- an empty grade stands for any grade: TypedSQL types the list without null
WITH ranked_position AS (
  SELECT
    r.function_id,
    r.rank,
    NULLIF(r.grade_id, '') AS grade_id
  FROM UNNEST($2::TEXT[], $3::TEXT[], $4::INT[]) AS r (function_id, grade_id, rank)
)

SELECT
  m.id,
  m.first_name AS "firstName",
  m.installation_date AS "installationDate",
  m.last_name AS "lastName",
  m.married_name AS "marriedName",
  p.function_id AS "functionId",
  rp.rank
FROM data_administration_context.magistrat AS m
  INNER JOIN data_administration_context."position" AS p
    ON p.id = NULLIF(m.current_position_id, '')::INT
  INNER JOIN ranked_position AS rp
    ON rp.function_id = p.function_id AND (rp.grade_id IS NULL OR rp.grade_id = p.grade_id)

WHERE (
  m.status = 'ACTIVE'
  AND p.jurisdiction_id = $1::TEXT
  AND ($5::TEXT IS NULL OR m."search" @@ TO_TSQUERY('unaccent_simple'::REGCONFIG, $5::TEXT))
)

ORDER BY
  rp.rank ASC,
  CASE WHEN $6::TEXT = 'installationDate' AND $7::BOOLEAN THEN m.installation_date END DESC NULLS LAST,
  CASE WHEN $6::TEXT = 'installationDate' AND NOT $7::BOOLEAN THEN m.installation_date END ASC NULLS LAST,
  CASE WHEN $6::TEXT = 'name' AND $7::BOOLEAN THEN m.last_name END DESC,
  CASE WHEN $6::TEXT = 'name' AND $7::BOOLEAN THEN m.first_name END DESC,
  m.last_name ASC,
  m.first_name ASC,
  m.id ASC

LIMIT $9::INT OFFSET $8::INT;
