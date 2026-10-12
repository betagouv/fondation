-- @param {String} $1:sessionId
-- @param {String} $2:versionId?
-- @param $3:nonFinalOutcomes
-- @param $4:finalOutcomes

SELECT
  COUNT(*)::INT AS "total",

  /* -- UNAFFECTED -- */
  /* without a version, '$2 IS NULL' matches the files without any reporter, regardless of the version */
  COUNT(*) FILTER (
    WHERE
      ddn.outcome IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM nominations_context.nomination_file_to_reporter AS nfr
        WHERE (
          nfr.nomination_file_id = ddn.id
          AND (
            /* versionId */$2::UUID IS NULL
            OR nfr.version_id = /* versionId */$2::UUID
          )
        )
      )
  )::INT AS "unaffected",

  /* -- IN PROGRESS -- */
  COUNT(*) FILTER (
    WHERE
      /* versionId */$2::UUID IS NOT NULL
      AND (
        ddn.outcome = ANY(/* nonFinalOutcomes */$3::nominations_context.nomination_file_outcome_enum[])
        OR (
          ddn.outcome IS NULL
          AND EXISTS (
            SELECT 1
            FROM nominations_context.nomination_file_to_reporter AS nfr
            WHERE (
              nfr.nomination_file_id = ddn.id
              AND nfr.version_id = /* versionId */$2::UUID
            )
          )
        )
      )
  )::INT AS "inProgress",

  /* -- WITH OUTCOME -- */
  COUNT(*) FILTER (
    WHERE
      /* versionId */$2::UUID IS NOT NULL
      AND ddn.outcome = ANY(/* finalOutcomes */$4::nominations_context.nomination_file_outcome_enum[])
  )::INT AS "withOutcome",

  /* -- MISSING EVALUATION -- */
  COUNT(*) FILTER (WHERE ddn.missing_evaluation)::INT AS "missingEvaluation",

  COUNT(*) FILTER (
    WHERE
      ddn.missing_evaluation
      AND ddn.missing_evaluation_comment IS NOT NULL
  )::INT AS "missingEvaluationWithComment"

FROM nominations_context.dossier_de_nomination AS ddn

WHERE ddn.session_id = /* sessionId */$1::UUID;
