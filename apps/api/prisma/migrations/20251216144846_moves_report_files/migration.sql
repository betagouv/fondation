INSERT INTO reports_context.report_files ("reportId", "fileId", "usage")
SELECT
  report_file.id AS "reportId",
  (report_file.content ->> 'fileId')::UUID AS "fileId",
  (report_file.content ->> 'usage')::reports_context.report_file_usage_enum AS "usage"
FROM (
  SELECT r.id, jsonb_array_elements(r.attached_files) AS content
  FROM reports_context.reports r
  WHERE r.attached_files IS NOT NULL
) AS report_file
  INNER JOIN files_context.files f ON f.id = (report_file.content->>'fileId')::UUID
ON CONFLICT ("fileId", "reportId") DO NOTHING;
