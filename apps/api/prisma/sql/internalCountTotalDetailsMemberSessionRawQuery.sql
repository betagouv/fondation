-- @param {formation} $1:formation?
-- @param {String} $2:sessionId
-- @param {type_de_saisine} $3:typeDeSaisine
-- @param {String} $4:reporterId
-- @param $5:status?

SELECT
  count(ddn.id)

FROM nominations_context.dossier_de_nomination ddn
  INNER JOIN nominations_context.session s ON ddn.session_id = s.id
  INNER JOIN reports_context.reports r ON r.nomination_file_id = ddn.id AND r.session_id = s.id

WHERE (
  ddn.session_id = $2::UUID
  AND s.deleted_at IS NULL
  AND s.type_de_saisine = $3::nominations_context.type_de_saisine
  AND r.reporter_id = $4::UUID
  AND r.is_deleted = FALSE
  AND ($1::formation IS NULL OR s.formation = $1::formation)
  AND ($5::report_state[] IS NULL OR r.state = ANY($5::"report_state"[]))
);
