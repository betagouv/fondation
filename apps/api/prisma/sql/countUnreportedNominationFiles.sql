-- @param {String} $1:sessionId
-- @param {String} $2:versionId?

SELECT COUNT(*)::INT AS "count"
FROM nominations_context.dossier_de_nomination AS ddn
WHERE
  ddn.session_id = /* sessionId */$1::UUID
  AND (
    /* versionId */$2::UUID IS NULL
    OR ddn.outcome IS NULL
    OR ddn.outcome != ALL('{VALIDATED,NON_VALIDATED,WITHDRAWN,REMOVED}'::nominations_context.nomination_file_outcome_enum[])
    OR NOT EXISTS (
      SELECT 1
      FROM docs.official_report_nomination_file AS orf
      WHERE (
        orf.nomination_file_id = ddn.id
        AND orf.outcome IS NOT NULL
        AND orf.outcome = ANY('{VALIDATED,NON_VALIDATED,WITHDRAWN}'::docs.agenda_file_outcome_enum[])
      )
    )
    OR NOT EXISTS (
      SELECT 1
      FROM nominations_context.nomination_file_to_reporter AS nfr
      WHERE (
        nfr.nomination_file_id = ddn.id
        AND nfr.version_id = /* versionId */$2::UUID
      )
    )
  );

