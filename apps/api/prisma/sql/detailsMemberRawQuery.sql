-- @param {String} $1:userId

WITH "member_stats" AS (
  SELECT
    r.reporter_id AS reporter_id,
    EXTRACT(YEAR FROM r.created_at) AS "year",
    d.targeted_grade AS targeted_grade,
    COUNT(r.id) AS "count"
  FROM reports_context.reports r
    INNER JOIN nominations_context.dossier_de_nomination d ON d.id = r.nomination_file_id
  WHERE r.is_deleted = FALSE AND r.reporter_id = $1::UUID
  GROUP BY r.reporter_id, EXTRACT(YEAR FROM r.created_at), d.targeted_grade
)

SELECT
  u.id,
  u.role,
  u.email,
  u.first_name AS "firstName",
  u.last_name AS "lastName",
  u.gender,
  u.display_title AS "displayTitle",
  u.title,

  COALESCE(excluded.jurisdictions, ARRAY[]::JSONB[])::JSONB[] AS "excludedJurisdictions",

  ARRAY_AGG(
    JSONB_BUILD_OBJECT(
      'year', "member_stats"."year",
      'targetedGrade', "member_stats"."targeted_grade",
      'count', COALESCE("member_stats"."count", 0)
    )
  ) FILTER (WHERE "member_stats"."year" IS NOT NULL) AS "stats"

FROM identity_and_access_context.users u

  LEFT JOIN "member_stats" ON "member_stats"."reporter_id" = u.id

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
    WHERE ej.user_id = u.id
    GROUP BY ej.user_id
  ) AS excluded ON TRUE

WHERE (
  u.id = $1::UUID
  AND u.role IN ('MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET', 'MEMBRE_DU_SIEGE')
)

GROUP BY u.id, excluded.jurisdictions;
