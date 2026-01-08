-- @param {String} $1:userId
-- @param {formation} $2:formation?

WITH
last_published_affectation_version_nb AS (
  SELECT
    session_id,
    MAX("version") AS "version"
  FROM nominations_context.affectation
  WHERE statut = 'PUBLIEE'::nominations_context.STATUT_AFFECTATION
  GROUP BY session_id
),

last_published_affectation AS (
  SELECT
    a.id,
    a.session_id
  FROM nominations_context.affectation AS a
    INNER JOIN last_published_affectation_version_nb AS lpav ON (
      lpav.session_id = a.session_id
      AND lpav."version" = a."version"
    )
)

SELECT
  s.id,
  s."name",
  s.date,
  s.created_at AS "createdAt",
  s.formation,
  s.type_de_saisine AS "typeDeSaisine",
  COUNT(nfr.user_id) FILTER (WHERE nfr.user_id = $1::UUID) AS "fileCount",
  COALESCE(
    ARRAY_AGG(DISTINCT nfr.user_id) FILTER (WHERE nfr.user_id = $1::UUID)::UUID[],
    ARRAY[]::UUID[]
  ) AS "reporterIds"

FROM nominations_context."session" AS s
  INNER JOIN last_published_affectation AS lpa ON lpa.session_id = s.id
  LEFT JOIN nominations_context.nomination_file_to_reporter AS nfr ON nfr.version_id = lpa.id

WHERE (
  s.type_de_saisine = 'TRANSPARENCE_GDS'::nominations_context.TYPE_DE_SAISINE
  AND ($2::FORMATION IS NULL OR s.formation = $2::FORMATION)
)

GROUP BY s.id;
