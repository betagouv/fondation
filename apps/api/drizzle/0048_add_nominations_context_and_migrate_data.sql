BEGIN;


ALTER TABLE "data_administration_context"."transparences" RENAME COLUMN "nomination_files_ids" TO "nomination_files";
ALTER TABLE "reports_context"."reports" ADD COLUMN "session_id" uuid NOT NULL;

CREATE SCHEMA "nominations_context";

CREATE TYPE "nominations_context"."type_de_saisine" AS ENUM('TRANSPARENCE_GDS');


CREATE TABLE "nominations_context"."affectation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"formation" "formation" NOT NULL,
	"affectations_dossiers_de_nominations" jsonb[] NOT NULL
);
CREATE TABLE "nominations_context"."dossier_de_nomination" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"dossier_de_nomination_importe_id" uuid NOT NULL,
	"content" jsonb NOT NULL
);
CREATE TABLE "nominations_context"."pre_analyse" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"dossier_de_nomination_id" uuid NOT NULL,
	"regles" jsonb[] NOT NULL
);
CREATE TABLE "nominations_context"."session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"formations" formation[] NOT NULL,
	"type_de_saisine" "nominations_context"."type_de_saisine" NOT NULL,
	"data_administration_import_id" text NOT NULL
);
-- Création des sessions
INSERT INTO "nominations_context"."session" (id, created_at, version, name, formations, type_de_saisine, data_administration_import_id)
SELECT gen_random_uuid(), now(), 1, name, formations, 'TRANSPARENCE_GDS', id from "data_administration_context"."transparences";



-- Création des dossiers de nomination
WITH "data_admin_nominations" AS (
	SELECT unnest(nomination_files)::jsonb AS nomination_file,
		id AS session_id
	FROM "data_administration_context"."transparences"
)
INSERT INTO "nominations_context"."dossier_de_nomination" (id, created_at, session_id, dossier_de_nomination_importe_id, content)
SELECT gen_random_uuid(), now(), session_id, (nomination_file ->> 'id')::uuid, nomination_file -> 'content' from data_admin_nominations;


ALTER TABLE "reports_context"."report_rule" DROP COLUMN "pre_validated";
ALTER TABLE "reports_context"."reports" DROP COLUMN "folder_number";
ALTER TABLE "reports_context"."reports" DROP COLUMN "biography";
ALTER TABLE "reports_context"."reports" DROP COLUMN "due_date";
ALTER TABLE "reports_context"."reports" DROP COLUMN "name";
ALTER TABLE "reports_context"."reports" DROP COLUMN "birth_date";
ALTER TABLE "reports_context"."reports" DROP COLUMN "transparency";
ALTER TABLE "reports_context"."reports" DROP COLUMN "grade";
ALTER TABLE "reports_context"."reports" DROP COLUMN "current_position";
ALTER TABLE "reports_context"."reports" DROP COLUMN "targetted_position";
ALTER TABLE "reports_context"."reports" DROP COLUMN "rank";
ALTER TABLE "reports_context"."reports" DROP COLUMN "observers";

DROP TYPE "public"."grade";



COMMIT;
