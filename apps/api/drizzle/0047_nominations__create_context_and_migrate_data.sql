BEGIN;


CREATE SCHEMA "nominations_context";

CREATE TYPE "nominations_context"."type_de_saisine" AS ENUM('TRANSPARENCE_GDS');


CREATE TABLE "data_administration_context"."transparences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "transparency" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"formation" "formation" NOT NULL,
	"nomination_files" jsonb[] NOT NULL,
	CONSTRAINT "transparences_name_formation_unique" UNIQUE("name","formation")
);


ALTER TABLE "reports_context"."reports" ADD COLUMN "session_id" uuid;


CREATE TABLE "nominations_context"."affectation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"formation" "formation" NOT NULL,
	"affectations_dossiers_de_nominations" jsonb[] NOT NULL,
	CONSTRAINT "affectation_session_id_unique" UNIQUE("session_id")
);

CREATE TABLE "nominations_context"."dossier_de_nomination" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"dossier_de_nomination_import_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	CONSTRAINT "dossier_de_nomination_dossier_de_nomination_import_id_unique" UNIQUE("dossier_de_nomination_import_id")
);

CREATE TABLE "nominations_context"."pre_analyse" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"dossier_de_nomination_id" uuid NOT NULL,
	"regles" jsonb[] NOT NULL,
	CONSTRAINT "pre_analyse_dossier_de_nomination_id_unique" UNIQUE("dossier_de_nomination_id")
);

CREATE TABLE "nominations_context"."session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"formation" "formation" NOT NULL,
	"type_de_saisine" "nominations_context"."type_de_saisine" NOT NULL,
	"session_import_id" text NOT NULL,
	CONSTRAINT "session_session_import_id_unique" UNIQUE("session_import_id")
);

-- -- Migration des transparences importées
WITH transparencies_per_formation AS (
    SELECT 
         (content ->> 'transparency')::transparency,
        (content ->> 'formation')::formation,
        array_agg(jsonb_build_object(
            'id', id,
            'createdAt', created_at,
            'rowNumber', row_number,
            'content', content
        )) as nomination_files_array
    FROM data_administration_context.nomination_files
    GROUP BY (content ->> 'transparency') , (content ->> 'formation')
)
INSERT INTO data_administration_context.transparences (id, name, created_at, formation, nomination_files)
SELECT 
    gen_random_uuid(),
    dt.transparency,
    NOW(),
    dt.formation,
    dt.nomination_files_array
FROM transparencies_per_formation dt;

-- Création des sessions
INSERT INTO "nominations_context"."session" (id, created_at, version, name, formation, type_de_saisine, session_import_id)
SELECT gen_random_uuid(), now(), 1, name, formation, 'TRANSPARENCE_GDS', id 
from "data_administration_context"."transparences";

-- Création des dossiers de nomination
WITH "data_admin_nominations" AS (
	SELECT unnest(nomination_files)::jsonb AS nomination_file,
		id AS transparence_id
	FROM "data_administration_context"."transparences"
),
"data_admin_nominations_with_session_id" AS (
	SELECT 
		nomination_file -> 'content' AS content,
		(nomination_file ->> 'id')::uuid AS dossier_de_nomination_import_id,
		s.id AS session_id
	FROM "data_admin_nominations" d
	inner JOIN "nominations_context"."session" s ON s.session_import_id::uuid = d.transparence_id
)
INSERT INTO "nominations_context"."dossier_de_nomination" (id, created_at, session_id, dossier_de_nomination_import_id, content)
SELECT gen_random_uuid(), now(), session_id, dossier_de_nomination_import_id, content 
from data_admin_nominations_with_session_id;

-- Migration des rapports
UPDATE "reports_context"."reports" r
SET 
	session_id = d.session_id,
	nomination_file_id = d.id
FROM "nominations_context"."dossier_de_nomination" d
WHERE 
	r.nomination_file_id = d.dossier_de_nomination_import_id
;

-- Création des affectations
WITH "report_affectations" AS (
    SELECT 
        r.session_id,
        jsonb_build_object(
            'dossierDeNominationId', r.nomination_file_id,
            'rapporteurIds', array_agg(r.reporter_id)
        ) as affectation_dossier
    FROM "reports_context"."reports" r
    GROUP BY r.session_id, r.nomination_file_id
),
"session_affectations" AS (
    SELECT 
        session_id,
        array_agg(affectation_dossier) as affectations_dossiers_de_nominations
    FROM "report_affectations"
    GROUP BY session_id
),
"sessions_affectations_with_formation" AS (
    SELECT 
        s.id as session_id,
        s.formation,
        sa.affectations_dossiers_de_nominations
    FROM "nominations_context"."session" s
    INNER JOIN "session_affectations" sa ON s.id = sa.session_id
)
INSERT INTO "nominations_context"."affectation" (id, created_at, session_id, formation, affectations_dossiers_de_nominations)
SELECT 
    gen_random_uuid(), 
    now(), 
    session_id, 
    formation, 
    affectations_dossiers_de_nominations
FROM "sessions_affectations_with_formation";

-- Ajout des contraintes d'intégrité
ALTER TABLE "reports_context"."reports"
	ALTER COLUMN "session_id" SET NOT NULL;

-- Suppression des colonnes et enums obsolètes
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