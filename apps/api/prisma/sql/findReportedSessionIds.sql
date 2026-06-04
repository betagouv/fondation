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
    FROM nominations_context.dossier_de_nomination ddn
    WHERE
      ddn.session_id = s.id
      AND (
        outcome IS NULL
        OR outcome != ALL('{VALIDATED,NON_VALIDATED,WITHDRAWN,REMOVED}'::nominations_context.nomination_file_outcome_enum[])
        OR NOT EXISTS (
          SELECT 1
          FROM docs.official_report_nomination_file ornf
          WHERE (
            ornf.nomination_file_id = ddn.id
            AND ornf.outcome = ANY('{VALIDATED,NON_VALIDATED,WITHDRAWN}'::docs.agenda_file_outcome_enum[])
          )
        )
      )
  );
