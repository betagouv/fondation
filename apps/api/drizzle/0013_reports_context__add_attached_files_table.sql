CREATE TABLE IF NOT EXISTS "reports_context"."attached_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"report_id" uuid NOT NULL,
	"file_id" uuid NOT NULL
);
