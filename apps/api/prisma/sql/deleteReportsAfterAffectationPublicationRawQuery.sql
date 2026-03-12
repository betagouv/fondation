-- @param {String} $1:sessionId
-- @param {String} $2:versionId

UPDATE reports_context.reports SET is_deleted = FALSE
WHERE session_id = $1::UUID AND is_deleted = false AND NOT EXISTS (
  SELECT id FROM nominations_context.nomination_file_to_reporter nfr
  WHERE (
    nfr.version_id = $2::UUID
    AND nfr.user_id = reports.reporter_id
    AND nfr.nomination_file_id = reports.nomination_file_id
  )
);
