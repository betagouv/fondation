BEGIN;

ALTER TABLE "reports_context"."reports" ADD COLUMN "nomination_file_id" uuid;--> statement-breakpoint

UPDATE reports_context.reports 
SET 
    nomination_file_id = nf.id
FROM data_administration_context.nomination_files nf
WHERE reports.id = nf.report_id;

ALTER TABLE "data_administration_context"."nomination_files" DROP COLUMN "report_id";

COMMIT;
