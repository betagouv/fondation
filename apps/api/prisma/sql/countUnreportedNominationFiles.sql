-- @param $1:sessionIds
-- @param $2:finalOutcomes
-- @param $3:finalDocOutcomes
-- @param {Boolean} $4:requiresPublishedAffectation
-- @param {String} $5:affectationVersionId?

SELECT
  ddn.session_id AS "sessionId",
  COUNT(*)::INT AS "count"
FROM nominations_context.dossier_de_nomination AS ddn
WHERE
  ddn.session_id = ANY(/* sessionIds */$1::UUID[])
  AND (
    ddn.outcome IS NULL
    OR ddn.outcome != ALL(
      /* finalOutcomes */$2::nominations_context.nomination_file_outcome_enum[]
    )
    OR NOT EXISTS (
      SELECT 1
      FROM docs.official_report_nomination_file AS ornf
        INNER JOIN docs.official_report AS orr ON orr.id = ornf.official_report_id
      WHERE
        ornf.nomination_file_id = ddn.id
        AND orr.validated_at IS NOT NULL
        AND ornf.outcome = ANY(/* finalDocOutcomes */$3::docs.agenda_file_outcome_enum[])
    )
    OR (
      /* requiresPublishedAffectation */$4::BOOLEAN = TRUE
      AND (
        /* affectationVersionId */$5::UUID IS NULL
        OR NOT EXISTS (
          SELECT 1
          FROM nominations_context.nomination_file_to_reporter AS nfr
          WHERE
            nfr.nomination_file_id = ddn.id
            AND nfr.version_id = /* affectationVersionId */$5::UUID
        )
      )
    )
  )
GROUP BY ddn.session_id;
