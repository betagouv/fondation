BEGIN;

CREATE SCHEMA "data_administration_context";
--> statement-breakpoint
CREATE SCHEMA "reports_context";
--> statement-breakpoint
CREATE TYPE "public"."formation" AS ENUM('PARQUET', 'SIEGE');--> statement-breakpoint
CREATE TYPE "public"."grade" AS ENUM('I', 'II', 'HH');--> statement-breakpoint
CREATE TYPE "public"."report_state" AS ENUM('NEW', 'IN_PROGRESS', 'READY_TO_SUPPORT', 'OPINION_RETURNED');--> statement-breakpoint
CREATE TYPE "public"."rule_group" AS ENUM('management', 'statutory', 'qualitative');--> statement-breakpoint
CREATE TYPE "public"."rule_name" AS ENUM('TRANSFER_TIME', 'GETTING_FIRST_GRADE', 'GETTING_GRADE_HH', 'GETTING_GRADE_IN_PLACE', 'PROFILED_POSITION', 'CASSATION_COURT_NOMINATION', 'OVERSEAS_TO_OVERSEAS', 'JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE', 'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT', 'JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION', 'GRADE_ON_SITE_AFTER_7_YEARS', 'MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS', 'MINISTER_CABINET', 'GRADE_REGISTRATION', 'HH_WITHOUT_2_FIRST_GRADE_POSITIONS', 'LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO', 'CONFLICT_OF_INTEREST_PRE_MAGISTRATURE', 'CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION', 'EVALUATIONS', 'DISCIPLINARY_ELEMENTS', 'HH_NOMINATION_CONDITIONS');--> statement-breakpoint
CREATE TYPE "public"."transparency" AS ENUM('MARCH_2025', 'AUTOMNE_2024');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_administration_context"."nomination_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"row_number" integer NOT NULL,
	"report_id" uuid,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports_context"."report_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_group" "rule_group" NOT NULL,
	"rule_name" "rule_name" NOT NULL,
	"pre_validated" boolean NOT NULL,
	"validated" boolean NOT NULL,
	"comment" text,
	"report_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports_context"."reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"biography" text NOT NULL,
	"due_date" date,
	"name" varchar NOT NULL,
	"birth_date" date NOT NULL,
	"state" "report_state" DEFAULT 'NEW' NOT NULL,
	"formation" "formation" NOT NULL,
	"transparency" "transparency" NOT NULL,
	"grade" "grade" NOT NULL,
	"current_position" varchar NOT NULL,
	"targetted_position" varchar NOT NULL,
	"comment" text,
	"rank" varchar NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_administration_context"."nomination_files" ADD CONSTRAINT "nomination_files_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "reports_context"."reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports_context"."report_rule" ADD CONSTRAINT "report_rule_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "reports_context"."reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

END;