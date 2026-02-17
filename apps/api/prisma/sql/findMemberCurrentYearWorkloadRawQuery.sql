WITH max_version AS (
  SELECT
    session_id,
    MAX("version") AS "version"
  FROM nominations_context.affectation
  WHERE created_at >= ((EXTRACT(YEAR FROM CURRENT_DATE)) || '-01-01')::DATE
  GROUP BY session_id
)

SELECT
  nfr.user_id AS "reporterId",
  ddn.targeted_grade AS "targetedGrade",
  COUNT(ddn.id) AS "workload"
FROM nominations_context.affectation
  INNER JOIN max_version
    ON max_version.session_id = affectation.session_id AND max_version."version" = affectation."version"
  INNER JOIN nominations_context.nomination_file_to_reporter AS nfr ON nfr.version_id = affectation.id
  INNER JOIN nominations_context.dossier_de_nomination AS ddn ON ddn.id = nfr.nomination_file_id
WHERE nfr.user_id = ANY($1::UUID[])
GROUP BY nfr.user_id, ddn.targeted_grade
ORDER BY nfr.user_id, ddn.targeted_grade;
