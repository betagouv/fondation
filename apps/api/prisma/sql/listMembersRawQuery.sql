-- @param {String} $2:search?
-- @param {String} $3:sortBy?
-- @param {String} $4:sortDirection?
-- @param {Int} $5:limit
-- @param {Int} $6:offset

WITH max_version AS (
  SELECT
    session_id,
    MAX("version") AS "version"
  FROM nominations_context.affectation
  WHERE created_at >= ((EXTRACT(YEAR FROM CURRENT_DATE)) || '-01-01')::DATE
  GROUP BY session_id
),

stats_for_current_year AS (
  SELECT
    nfr.user_id AS reporter_id,
    ddn.targeted_grade,
    EXTRACT(YEAR FROM affectation.created_at) AS "year",
    COUNT(ddn.id) AS count

  FROM nominations_context.affectation
    INNER JOIN max_version
      ON max_version.session_id = affectation.session_id AND max_version."version" = affectation."version"
    LEFT JOIN nominations_context.nomination_file_to_reporter AS nfr ON nfr.version_id = affectation.id
    LEFT JOIN nominations_context.dossier_de_nomination AS ddn ON ddn.id = nfr.nomination_file_id

  GROUP BY nfr.user_id, EXTRACT(YEAR FROM affectation.created_at), ddn.targeted_grade
  ORDER BY EXTRACT(YEAR FROM affectation.created_at) ASC
)

SELECT
  m.id,
  m."role",
  m.first_name AS "firstName",
  m.last_name AS "lastName",
  COALESCE(
    ARRAY_AGG(
      JSON_BUILD_OBJECT(
        'year', s."year",
        'targetedGrade', s.targeted_grade,
        'count', COALESCE(s.count, 0)
      )
    ) FILTER (WHERE s."year" IS NOT NULL),
    ARRAY[]::JSON[]
  )::JSON[] AS stats,

  COALESCE(excluded.jurisdictions, ARRAY[]::JSONB[])::JSONB[] AS "excludedJurisdictions"
FROM
  identity_and_access_context."users" AS m
  LEFT JOIN stats_for_current_year AS s ON s.reporter_id = m.id

  LEFT JOIN LATERAL (
    SELECT ARRAY_AGG(
      JSONB_BUILD_OBJECT(
        'id', j.codejur,
        'label', j.libelle
      )
    ) FILTER (WHERE j.codejur IS NOT NULL) AS "jurisdictions"
    FROM data_administration_context.excluded_jurisdictions ej
      LEFT JOIN data_administration_context.jurisdictions j
        ON j.codejur = ej.jurisdiction_id
    WHERE ej.user_id = m.id
    GROUP BY ej.user_id
  ) AS excluded ON TRUE

WHERE (
  m."role" = ANY($1)
  AND ($2::TEXT IS NULL OR (
    m.email ILIKE '%' || $2::TEXT || '%'
    OR m.first_name ILIKE '%' || $2::TEXT || '%'
    OR m.last_name ILIKE '%' || $2::TEXT || '%'
  ))
)

GROUP BY m.id, excluded.jurisdictions
ORDER BY (
  CASE
    WHEN $3::TEXT IS NOT NULL AND $4::TEXT = 'desc' THEN
      CASE
        WHEN $3::TEXT = 'firstName' THEN m.first_name
        ELSE m.last_name
      END
  END
) DESC, (
  CASE
    WHEN $3::TEXT = 'firstName' THEN m.first_name
    ELSE m.last_name
  END
) ASC

LIMIT $5::INT OFFSET $6::INT;
