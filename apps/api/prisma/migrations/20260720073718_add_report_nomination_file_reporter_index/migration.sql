-- CreateIndex
CREATE INDEX "reports_nomination_file_id_reporter_id_idx" ON "reports_context"."reports"("nomination_file_id", "reporter_id");
