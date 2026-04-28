-- @param {String} $1:search?
-- @param $2:ignoreIds?
-- @param {Int} $3:offset
-- @param {Int} $4:limit

SELECT
  m.id,
  m.civilite AS "civility",
  m.first_name AS "firstName",
  m.last_name AS "lastName",
  m.used_name AS "usedName",
  m.grade,

  p.function_id AS "functionId",
  p.jurisdiction_id AS "jurisdictionId",
  m.admin_position AS "currentPosition",

  TS_RANK("search", query) AS "rank"

FROM nominations_context."magistrat" m
  LEFT JOIN data_administration_context."position" p ON p.id = m.current_position_id::INT,
  TO_TSQUERY('unaccent_fr'::regconfig, $1::TEXT) AS "query"

WHERE (
  1=1
  AND ($1::TEXT IS NULL OR (
    "search" @@ "query"
  ))
  AND ($2::UUID[] IS NULL OR (
    m.id != ALL($2::UUID[])
  ))
)

ORDER BY "rank" DESC, m.used_name ASC

OFFSET $3 LIMIT $4;
