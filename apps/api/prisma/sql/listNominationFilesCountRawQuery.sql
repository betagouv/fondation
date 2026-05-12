-- @param {String} $1:versionId?

-- @param $2:priorities?
-- @param {Boolean} $3:hasNoPriority?
-- @param $4:reporterIds?
-- @param {Boolean} $5:hasNoReporter?
-- @param $6:outcomes?
-- @param {Boolean} $7:hasNoOutcome
-- @param {String} $8:search?

-- @param {String} $9:sessionId

SELECT COUNT(ddn.id)

FROM
  nominations_context.dossier_de_nomination AS ddn

  LEFT JOIN LATERAL (
    SELECT nfr.user_id
    FROM nominations_context.nomination_file_to_reporter AS nfr
    WHERE nfr.nomination_file_id = ddn.id AND nfr.version_id = /* versionId */$1::UUID
  ) AS reporters ON TRUE,

  TO_TSQUERY('unaccent_fr'::REGCONFIG, /* search */$8::TEXT) AS query

-- see listNominationFilesRawQuery.sql
WHERE (
  ddn.session_id = $9::UUID

  /* -- PRIORITIES -- */
  AND (
    (/* priorities */$2::nominations_context.priorite_enum[] IS NULL AND /* hasNoPriority */$3 = FALSE)
    OR (
      ARRAY_LENGTH(/* priorities */$2::nominations_context.priorite_enum[], 1) IS NOT NULL
      AND (ddn.priorities && /* priorities */$2::nominations_context.priorite_enum[])
    ) OR (/* hasNoPriority */$3::BOOLEAN = TRUE AND ARRAY_LENGTH(ddn.priorities, 1) IS NULL)
  )

  /* -- REPORTERS -- */
  AND (
    (/* reporterIds */$4::UUID[] IS NULL AND $5::BOOLEAN = FALSE)
    OR (
      ARRAY_LENGTH(/* reporterIds */$4::UUID[], 1) IS NOT NULL
      AND reporters.user_id = ANY(/* reporterIds */$4::UUID[])
    ) OR (
      /* hasNoReporter */$5::BOOLEAN
      AND /* versionId */$1::UUID IS NOT NULL
      AND NOT EXISTS (
        SELECT user_id
        FROM nominations_context.nomination_file_to_reporter AS sub_nfr
        WHERE (
          sub_nfr.version_id = /* versionId */$1::UUID
          AND sub_nfr.nomination_file_id = ddn.id
        )
      )
    )
  )

  /* -- OUTCOMES -- */
  AND (
    (/* outcomes */$6::nominations_context.nomination_file_outcome_enum[] IS NULL AND /* hasNoOutcome */$7::BOOLEAN = FALSE)
    OR (
      ARRAY_LENGTH(/* outcomes */$6::nominations_context.nomination_file_outcome_enum[], 1) IS NOT NULL
      AND ddn.outcome = ANY(/* outcomes */$6::nominations_context.nomination_file_outcome_enum[])
    ) OR (
      /* hasNoOutcome */$7::BOOLEAN
      AND ddn.outcome IS NULL
    )
  )

  /* -- SEARCH -- */
  AND ($8::TEXT IS NULL OR ddn."search" @@ query)
)

