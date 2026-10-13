-- @param {String} $1:search?
-- @param $2:ignoreIds?
-- @param {Int} $3:offset
-- @param {Int} $4:limit

SELECT
  m.id,
  m.first_name AS "firstName",
  m.last_name AS "lastName",
  m.married_name AS "marriedName",
  m.used_name AS "usedName",
  m.grade,
  m.status,

  f.id AS "functionId",
  f.label AS "functionLabel",
  REGEXP_REPLACE(j.codejur, ' {2,}', ' ', 'g') AS "jurisdictionId",
  j.libelle AS "jurisdictionLabel"

FROM nominations_context."magistrat" m
  LEFT JOIN data_administration_context."position" p ON p.id = NULLIF(m.current_position_id, '')::INT
  LEFT JOIN data_administration_context."function" f ON f.id = p.function_id
  LEFT JOIN data_administration_context."jurisdictions" j ON j.codejur = p.jurisdiction_id

WHERE (
  1=1
  AND ($1::TEXT IS NULL OR (
    m.search @@ TO_TSQUERY('unaccent_fr'::regconfig, $1::TEXT)
  ))
  AND ($2::UUID[] IS NULL OR (
    m.id != ALL($2::UUID[])
  ))
)

ORDER BY m.last_name ASC, m.first_name ASC, m.id ASC

OFFSET $3 LIMIT $4;
