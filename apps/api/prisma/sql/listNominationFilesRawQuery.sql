-- @param {String} $1:versionId?
-- @param {String} $2:userId
-- @param {Int} $3:limit
-- @param {Int} $4:offset

-- @param $5:priorities?
-- @param {Boolean} $6:hasNoPriority?
-- @param $7:reporterIds?
-- @param {Boolean} $8:hasNoReporter?
-- @param $9:outcomes?
-- @param {Boolean} $10:hasNoOutcome
-- @param {String} $11:search?

-- @param {String} $12:sortBy?
-- @param {String} $13:sortOrder?
-- @param {String} $14:sessionId

SELECT
  ddn.id,
  ARRAY_TO_JSON(ddn.priorities) AS "priorities",
  ddn."comment",
  ddn.audition_date AS "auditionDate",
  ddn.audition_time AS "auditionTime",
  ddn.biography,
  ddn.birth_date AS "birthDate",
  ddn.current_position AS "currentPosition",
  ddn.grade,
  ddn.last_position_date AS "lastPositionDate",
  ddn.last_ranking_date AS "lastRankingDate",
  ddn."name",
  ddn.number,
  ddn.observers,
  ddn.rank,
  ddn.targeted_position AS "targetedPosition",
  ddn.targeted_grade AS "targetedGrade",
  ddn.due_date AS "dueDate",
  ddn.outcome,
  ddn.outcome_comment AS "outcomeComment",
  ddn.alert_hidden AS "alertHidden",
  ddn.missing_evaluation AS "missingEvaluation",
  ddn.detected_jurisdiction_id AS "detectedJurisdictionId",
  ddn.detected_targeted_function_id AS "detectedTargetedFunctionId",
  ddn.detected_magistrat_id AS "detectedMagistratId",

  EXISTS (
    SELECT 1
    FROM nominations_context.nomination_file_attachment AS nfa
    WHERE nfa.nomination_file_id = ddn.id
  ) AS "hasAttachment",

  TS_RANK(ddn."search", query) AS "queryRank",

  summaries."summary" AS summary,
  member_memo.memo AS "memberMemo",

  COALESCE(observations.observations, ARRAY[]::JSON[]) AS observations,
  COALESCE(reporters.reporters, ARRAY[]::JSON[]) AS reporters

FROM
  nominations_context.dossier_de_nomination AS ddn

  LEFT JOIN LATERAL (
    SELECT
      ARRAY_AGG(
        JSON_BUILD_OBJECT(
          'user',
          JSON_BUILD_OBJECT(
            'id', "user".id,
            'firstName', "user".first_name,
            'lastName', "user".last_name
          )
        )
      ) FILTER (WHERE "user".id IS NOT NULL) AS reporters
    FROM nominations_context.nomination_file_to_reporter AS nfr
      LEFT JOIN identity_and_access_context."users" AS "user" ON "user".id = nfr.user_id
    WHERE nfr.nomination_file_id = ddn.id AND nfr.version_id = /* versionId */$1::UUID
  ) AS reporters ON TRUE

  LEFT JOIN LATERAL (
    SELECT ARRAY_AGG(sub_obs.observation) AS observations
    FROM (
      SELECT
        JSON_BUILD_OBJECT(
          'id', obs.id,
          'followUp', obs.follow_up,
          'followUpComment', obs.follow_up_comment,
          'description', obs.description,
          'dateReception', obs.date_reception,

          'magistrat', JSON_BUILD_OBJECT(
            'id', m.id,
            'firstName', m.first_name,
            'lastName', m.last_name,
            'usedName', m.used_name
          ),
          'memberComments', JSON_AGG(
            JSON_BUILD_OBJECT('comment', omc."comment")
          )
        ) AS observation

      FROM nominations_context.observation AS obs
        LEFT JOIN nominations_context.magistrat AS m ON m.id = obs.magistrat_id
        LEFT JOIN nominations_context.observation_member_comment AS omc ON (
          omc.observation_id = obs.id
          AND omc.user_id = /* userId */$2::UUID
        )

      WHERE obs.nomination_file_id = ddn.id
      GROUP BY obs.id, m.id
    ) AS sub_obs
  ) AS observations ON TRUE

  LEFT JOIN LATERAL (
    SELECT (ARRAY_AGG(member_memo))[1] AS "memo"
    FROM nominations_context.member_memo
    WHERE member_memo.nomination_file_id = ddn.id AND member_memo.user_id = /* userId */$2::UUID
    GROUP BY member_memo.nomination_file_id
  ) AS member_memo ON TRUE

  LEFT JOIN LATERAL (
    SELECT (ARRAY_AGG(sub_summaries.summary))[1] AS summary
    FROM (
      SELECT
        JSON_BUILD_OBJECT(
          'authorId', summaries.author_id,
          'readers', ARRAY_AGG(readers.user_id) FILTER (WHERE readers.user_id IS NOT NULL)
        ) AS "summary"

      FROM nominations_context.summaries
        LEFT JOIN
          nominations_context.summary_readers AS readers
          ON readers.summary_id = summaries.nomination_file_id

      WHERE
        summaries.nomination_file_id = ddn.id
        AND TRIM(summaries."content") != ''
      GROUP BY summaries.nomination_file_id
    ) AS sub_summaries
  ) AS summaries ON TRUE,

  TO_TSQUERY('unaccent_fr'::REGCONFIG, /* search */$11::TEXT) AS query

WHERE (
  ddn.session_id = $14::UUID

  /* -- PRIORITIES -- */
  AND (
    (/* priorities */$5::nominations_context.priorite_enum[] IS NULL AND /* hasNoPriority */$6 = FALSE)
    OR (
      ARRAY_LENGTH(/* priorities */$5::nominations_context.priorite_enum[], 1) IS NOT NULL
      AND (ddn.priorities && /* priorities */$5::nominations_context.priorite_enum[])
    ) OR (/* hasNoPriority */$6::BOOLEAN = TRUE AND ARRAY_LENGTH(ddn.priorities, 1) IS NULL)
  )

  /* -- REPORTERS -- */
  AND (
    (/* reporterIds */$7::UUID[] IS NULL AND $8::BOOLEAN = FALSE)
    OR (
      ARRAY_LENGTH(/* reporterIds */$7::UUID[], 1) IS NOT NULL
      AND EXISTS (
        SELECT user_id
        FROM nominations_context.nomination_file_to_reporter AS sub_nfr
        WHERE (
          sub_nfr.version_id = /* versionId */$1::UUID
          AND sub_nfr.nomination_file_id = ddn.id
          AND sub_nfr.user_id = ANY(/* reporterIds */$7::UUID[])
        )
      )
    ) OR (
      /* hasNoReporter */$8::BOOLEAN
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
    (/* outcomes */$9::nominations_context.nomination_file_outcome_enum[] IS NULL AND /* hasNoOutcome */$10::BOOLEAN = FALSE)
    OR (
      ARRAY_LENGTH(/* outcomes */$9::nominations_context.nomination_file_outcome_enum[], 1) IS NOT NULL
      AND ddn.outcome = ANY(/* outcomes */$9::nominations_context.nomination_file_outcome_enum[])
    ) OR (
      /* hasNoOutcome */$10::BOOLEAN
      AND ddn.outcome IS NULL
    )
  )

  /* -- SEARCH -- */
  AND ($11::TEXT IS NULL OR ddn."search" @@ query)
)

ORDER BY 
  (CASE WHEN $11::TEXT IS NOT NULL THEN /* queryRank */ TS_RANK(ddn."search", query) END) DESC,

  /* DESC */
  (CASE WHEN $12::TEXT = 'name' AND $13::TEXT = 'desc' THEN "name" END) DESC,
  (CASE WHEN $12::TEXT = 'targetedPosition' AND $13::TEXT = 'desc' THEN "targeted_position" END) DESC,
  (CASE WHEN $12::TEXT = 'targetedGrade' AND $13::TEXT = 'desc' THEN "sortable_targeted_grade" END) DESC,
  (CASE WHEN $12::TEXT = 'targetedGrade' AND $13::TEXT = 'desc' THEN "number" END) ASC,
  (CASE WHEN ($12::TEXT = 'fileNumber' OR $12::TEXT IS NULL) AND $13::TEXT = 'desc' THEN "number" END) DESC,

  /* ASC */
  (CASE WHEN $12::TEXT = 'name' AND ($13::TEXT = 'asc' OR $13::TEXT IS NULL) THEN "name" END) ASC,
  (CASE WHEN $12::TEXT = 'targetedPosition' AND ($13::TEXT = 'asc' OR $13::TEXT IS NULL) THEN "targeted_position" END) ASC,
  (CASE WHEN $12::TEXT = 'targetedGrade' AND ($13::TEXT = 'asc' OR $13::TEXT IS NULL) THEN "sortable_targeted_grade" END) ASC,
  (CASE WHEN ($12::TEXT = ANY('{targetedGrade,fileNumber}'::TEXT[]) OR $12::TEXT IS NULL) AND ($13::TEXT = 'asc' OR $13::TEXT IS NULL) THEN "number" END) ASC

LIMIT /* limit */$3::INT OFFSET /* offset */$4::INT;
