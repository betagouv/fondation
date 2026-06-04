-- @param $1:sessionIds

SELECT s.id
FROM nominations_context.session AS s
WHERE
  s.id = ANY(/* sessionIds */$1::UUID[])
  AND s.deleted_at IS NULL
  AND s.archived_at IS NULL
  AND s.is_validated = TRUE

  AND NOT EXISTS (
    SELECT 1
    FROM nominations_context.dossier_de_nomination 
    WHERE session_id = s.id AND (
      outcome IS NULL
      OR outcome != ALL('{VALIDATED,NON_VALIDATED,WITHDRAWN,REMOVED}'::nominations_context.nomination_file_outcome_enum[])
    )
  )

  AND NOT EXISTS (
    SELECT 1
    FROM nominations_context.dossier_de_nomination ddn
      LEFT JOIN docs.official_report_nomination_file ornf ON ornf.nomination_file_id = ddn.id
    WHERE ddn.session_id = s.id AND ornf.nomination_file_id IS NULL
  );
