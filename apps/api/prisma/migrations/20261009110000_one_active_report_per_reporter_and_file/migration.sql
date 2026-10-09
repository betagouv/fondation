-- deleted reports stay for their content to come back: only the active ones are unique
-- (on 2026-10-09, production held 1,840 deleted duplicates and never two active reports for a same reporter and file)
CREATE UNIQUE INDEX "reports_one_active_per_reporter_and_file_key" ON "reports_context"."reports"("session_id", "nomination_file_id", "reporter_id") WHERE (is_deleted = false);
