-- @param {formation} $1:formation?
-- @param {String} $2:sessionId
-- @param {type_de_saisine} $3:typeDeSaisine
-- @param {String} $4:reporterId
-- @param $5:status?
-- @param {String} $6:sortDirection?
-- @param {String} $7:sortBy?
-- @param {Int} $8:limit
-- @param {Int} $9:offset

SELECT
  ddn.session_id,
  ddn.id,
  ddn.biography,
  ddn.current_position AS "currentPosition",
  ddn.grade,
  ddn.last_position_date AS "lastPositionDate",
  ddn.last_ranking_date AS "lastRankingDate",
  ddn.name,
  ddn.number,
  ddn.observers,
  ddn.rank,
  ddn.targeted_position AS "targetedPosition",
  ddn.priorite,

  JSONB_AGG(observations) AS "observations",
  JSONB_AGG(
    JSONB_BUILD_OBJECT('id', r.id, 'state', r.state)
  ) AS "reports"

FROM nominations_context.dossier_de_nomination ddn
  INNER JOIN nominations_context.session s ON ddn.session_id = s.id
  INNER JOIN reports_context.reports r ON r.nomination_file_id = ddn.id AND r.session_id = s.id
  LEFT JOIN LATERAL (
    SELECT
      o.id,
      o.description,

      COALESCE(
        JSONB_AGG(JSONB_BUILD_OBJECT('userId', omc.user_id, 'comment', omc.comment))
          FILTER (WHERE omc.user_id IS NOT NULL),
          '[]'::JSONB
      ) AS "userComments",

      JSON_AGG(JSONB_BUILD_OBJECT(
        'id', m.id,
        'firstName', m.first_name,
        'lastName', m.last_name
      )) FILTER (WHERE m.id IS NOT NULL) AS "magistrat"

    FROM nominations_context.observation o
      LEFT JOIN nominations_context.magistrat m ON m.id = o.magistrat_id
      LEFT JOIN nominations_context.observation_member_comment omc ON omc.observation_id = o.id AND omc.user_id = $4::UUID
    WHERE o.nomination_file_id = ddn.id
    GROUP BY o.id
  ) AS observations ON TRUE

WHERE (
  ddn.session_id = $2::UUID
  AND s.type_de_saisine = $3::nominations_context.type_de_saisine
  AND ($1::formation IS NULL OR s.formation = $1::formation)
  AND r.reporter_id = $4::UUID
  AND r.is_deleted = FALSE
  AND ($5::report_state[] IS NULL OR r.state = ANY($5::"report_state"[]))
)

GROUP BY ddn.id

ORDER BY 
  (CASE WHEN $6::TEXT = 'desc' AND $7::TEXT = 'name' THEN ddn.name END) DESC,
  (CASE WHEN $6::TEXT = 'desc' AND $7::TEXT = 'targetedPosition' THEN ddn.targeted_position END) DESC,
  (CASE WHEN $6::TEXT = 'desc' AND $7::TEXT = 'number' THEN ddn.number END) DESC,
  (
    CASE
      WHEN $6::TEXT IS NULL OR $6::TEXT = 'asc' AND $7::TEXT = 'targetedPosition' THEN ddn.targeted_position
      WHEN $6::TEXT IS NULL OR $6::TEXT = 'asc' AND $7::TEXT = 'name' THEN ddn.name
    END
  ) ASC,
  (CASE WHEN ($6 IS NULL OR $6::TEXT = 'asc') AND ($7 IS NULL OR $7::TEXT = 'number') THEN ddn.number END) ASC

LIMIT $8::INT OFFSET $9::INT
