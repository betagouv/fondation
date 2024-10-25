ALTER TABLE "data_administration_context"."nomination_files" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_context"."report_rule" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_context"."reports" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;