BEGIN;

ALTER TABLE "reports_context"."attached_files" DROP COLUMN IF EXISTS "id";
ALTER TABLE "reports_context"."attached_files" ADD CONSTRAINT "attached_files_report_id_name_pk" PRIMARY KEY("report_id","name");--> statement-breakpoint
ALTER TABLE "reports_context"."attached_files" ADD COLUMN "file_id" varchar NOT NULL;--> statement-breakpoint

COMMIT;