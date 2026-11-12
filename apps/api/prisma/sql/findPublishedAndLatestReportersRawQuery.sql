-- @param $1:nominationFileIds

WITH last_versions AS (
  SELECT
    a.session_id,
    MAX(a."version") AS latest,
    MAX(a."version") FILTER (WHERE a.statut = 'PUBLIEE') AS published
  FROM nominations_context.affectation AS a
  WHERE
    a.session_id IN (
      SELECT d.session_id
      FROM nominations_context.dossier_de_nomination AS d
      WHERE d.id = ANY($1::UUID[])
    )
  GROUP BY a.session_id
)

SELECT
  r.nomination_file_id AS "nominationFileId",
  r.user_id AS "userId",
  a."version" = lv.latest AS "isLatest",
  a."version" = lv.published AS "isPublished"
FROM nominations_context.nomination_file_to_reporter AS r
  INNER JOIN nominations_context.affectation AS a
    ON a.id = r.version_id
  INNER JOIN last_versions AS lv
    ON
      lv.session_id = a.session_id
      AND a."version" IN (lv.latest, lv.published)
WHERE r.nomination_file_id = ANY($1::UUID[])
