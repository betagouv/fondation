-- @param {String} $1:jurisdictionId
-- @param $2:functionIds
-- @param $3:gradeIds
-- @param $4:ranks
-- @param {String} $5:search?

-- an empty grade stands for any grade: TypedSQL types the list without null
WITH ranked_position AS (
  SELECT
    r.function_id,
    r.rank,
    NULLIF(r.grade_id, '') AS grade_id
  FROM UNNEST($2::TEXT[], $3::TEXT[], $4::INT[]) AS r (function_id, grade_id, rank)
)

SELECT
  rp.rank,
  COUNT(m.id) AS holders
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

GROUP BY rp.rank;
