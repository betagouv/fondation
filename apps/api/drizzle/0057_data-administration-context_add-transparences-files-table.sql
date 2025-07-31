CREATE TABLE IF NOT EXISTS "data_administration_context"."transparence_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transparence_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_administration_context"."transparence_files" ADD CONSTRAINT "transparence_files_transparence_id_transparences_id_fk" FOREIGN KEY ("transparence_id") REFERENCES "data_administration_context"."transparences"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_administration_context"."transparence_files" ADD CONSTRAINT "transparence_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
