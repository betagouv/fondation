-- @param {String} $2:search?
-- @param {String} $3:sortBy?
-- @param {String} $4:sortDirection?
-- @param {Int} $5:limit
-- @param {Int} $6:offset

WITH stats_for_current_year AS (
  SELECT
    r.reporter_id AS reporter_id,
    EXTRACT (YEAR FROM r.created_at) AS "year",
    d.targeted_grade AS targeted_grade,
    COUNT(r.id) AS "count"
  FROM reports_context.reports r
    INNER JOIN nominations_context.dossier_de_nomination d ON d.id = r.nomination_file_id
  WHERE r.is_deleted = FALSE AND r.created_at >= ((EXTRACT (YEAR FROM CURRENT_DATE)) || '-01-01')::DATE
  GROUP BY r.reporter_id, EXTRACT (YEAR FROM r.created_at), d.targeted_grade
  ORDER BY EXTRACT (YEAR FROM r.created_at) ASC
)

SELECT 
  m.id,
  m.role,
  m.first_name AS "firstName",
  m.last_name AS "lastName",
  COALESCE(
    ARRAY_AGG(
      JSON_BUILD_OBJECT(
        'year', s.year, 
        'targetedGrade', s.targeted_grade, 
        'count', COALESCE(s.count, 0)
      )
    ) FILTER (WHERE s.year IS NOT NULL),
    ARRAY[]::JSON[]
  )::JSON[] AS "stats"
FROM
  identity_and_access_context.users m
  LEFT JOIN stats_for_current_year s ON s.reporter_id = m.id

WHERE (
  m.role = ANY($1)
  AND ($2::TEXT IS NULL OR (
    m.email ILIKE '%' || $2::TEXT || '%'
    OR m.first_name ILIKE '%' || $2::TEXT || '%'
    OR m.last_name ILIKE '%' || $2::TEXT || '%'
  ))
)

GROUP BY m.id
ORDER BY (
  CASE
    WHEN $3::TEXT IS NOT NULL AND $4::TEXT = 'desc' THEN
      CASE
        WHEN $3::TEXT = 'firstName' THEN "first_name"
        ELSE "last_name"
      END
  END
) DESC, (
  CASE
    WHEN $3::TEXT = 'firstName' THEN "first_name"
    ELSE "last_name"
  END
) ASC

LIMIT $5::INT OFFSET $6::INT;