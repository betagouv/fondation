-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "data_administration_context";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "docs";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "files_context";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity_and_access_context";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "jobs";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "nominations_context";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "reports_context";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- CreateTextSearchConfiguration
DROP TEXT SEARCH CONFIGURATION IF EXISTS unaccent_fr;
CREATE TEXT SEARCH CONFIGURATION unaccent_fr ( COPY = french );

ALTER TEXT SEARCH CONFIGURATION unaccent_fr
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, french_stem;

-- CreateEnum
CREATE TYPE "data_administration_context"."nomination_type_enum" AS ENUM ('PROMOTION', 'EQUIVALENT');

-- CreateEnum
CREATE TYPE "docs"."agenda_file_outcome_enum" AS ENUM ('VALIDATED', 'NON_VALIDATED', 'SUSPENDED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "files_context"."storage_provider" AS ENUM ('SCALEWAY');

-- CreateEnum
CREATE TYPE "identity_and_access_context"."gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "identity_and_access_context"."role" AS ENUM ('MEMBRE_DU_SIEGE', 'MEMBRE_DU_PARQUET', 'MEMBRE_COMMUN', 'ADJOINT_SECRETAIRE_GENERAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "nominations_context"."user_title_enum" AS ENUM ('PRESIDENT_SIEGE', 'PRESIDENT_PARQUET', 'FIRST_SECRETARY', 'DEPUTY_PRESIDENT_SIEGE', 'DEPUTY_PRESIDENT_PARQUET');

-- CreateEnum
CREATE TYPE "nominations_context"."user_duty_enum" AS ENUM ('PRESIDENT', 'SECRETARY', 'OFFICER', 'DEPUTY_PRESIDENT');

-- CreateEnum
CREATE TYPE "jobs"."status_enum" AS ENUM ('IDLE', 'RUNNING', 'FAILED', 'SUCCEEDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "nominations_context"."nomination_file_outcome_enum" AS ENUM ('VALIDATED', 'NON_VALIDATED', 'SUSPENDED', 'REMOVED', 'WITHDRAWN', 'ASSESSING', 'WAITING_DSJ');

-- CreateEnum
CREATE TYPE "nominations_context"."priorite_enum" AS ENUM ('ETOILE', 'OUTRE_MER', 'PROFILE');

-- CreateEnum
CREATE TYPE "nominations_context"."type_de_saisine" AS ENUM ('TRANSPARENCE_GDS');

-- CreateEnum
CREATE TYPE "nominations_context"."statut_affectation" AS ENUM ('BROUILLON', 'PUBLIEE');

-- CreateEnum
CREATE TYPE "formation" AS ENUM ('PARQUET', 'SIEGE');

-- CreateEnum
CREATE TYPE "nominations_context"."observation_follow_up_enum" AS ENUM ('REFERENCE', 'ALERT', 'INTERESTING');

-- CreateEnum
CREATE TYPE "reports_context"."report_file_usage_enum" AS ENUM ('ATTACHMENT', 'EMBEDDED_SCREENSHOT');

-- CreateEnum
CREATE TYPE "reports_context"."rule_group" AS ENUM ('management', 'statutory', 'qualitative');

-- CreateEnum
CREATE TYPE "reports_context"."rule_name" AS ENUM ('TRANSFER_TIME', 'GETTING_GRADE_IN_PLACE', 'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT', 'JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION', 'GRADE_ON_SITE_AFTER_7_YEARS', 'MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS', 'MINISTER_CABINET', 'GRADE_REGISTRATION', 'HH_WITHOUT_2_FIRST_GRADE_POSITIONS', 'LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO', 'RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS', 'NOMINATION_CA_AVANT_4_ANS', 'CONFLICT_OF_INTEREST_PRE_MAGISTRATURE', 'CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION', 'EVALUATIONS', 'DISCIPLINARY_ELEMENTS');

-- CreateEnum
CREATE TYPE "report_state" AS ENUM ('NEW', 'IN_PROGRESS', 'READY_TO_SUPPORT', 'SUPPORTED');

-- CreateTable
CREATE TABLE "data_administration_context"."excluded_jurisdictions" (
    "user_id" UUID NOT NULL,
    "jurisdiction_id" TEXT NOT NULL,

    CONSTRAINT "excluded_jurisdictions_user_id_jurisdiction_id_pk" PRIMARY KEY ("user_id","jurisdiction_id")
);

-- CreateTable
CREATE TABLE "data_administration_context"."jurisdictions" (
    "codejur" TEXT NOT NULL,
    "type_jur" TEXT NOT NULL,
    "adr1" TEXT,
    "adr2" TEXT,
    "arrondissement" TEXT,
    "codepos" TEXT,
    "date_suppression" DATE,
    "libelle" TEXT,
    "ressort" TEXT,
    "ville_jur" TEXT,
    "ville" TEXT,

    CONSTRAINT "jurisdictions_pkey" PRIMARY KEY ("codejur")
);

-- CreateTable
CREATE TABLE "data_administration_context"."jurisdiction_type" (
    "id" CHAR(4) NOT NULL,
    "label" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "jurisdiction_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_administration_context"."grade" (
    "grade" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort" SMALLINT NOT NULL,
    "mass_grade_id" TEXT,

    CONSTRAINT "grade_pkey" PRIMARY KEY ("grade")
);

-- CreateTable
CREATE TABLE "data_administration_context"."function" (
    "id" TEXT NOT NULL,
    "sort" SMALLINT NOT NULL,
    "formation" "formation",
    "addition" TEXT,
    "label" TEXT NOT NULL,
    "label_one_male" TEXT,
    "label_one_female" TEXT,
    "label_other_male" TEXT,
    "label_other_female" TEXT,

    CONSTRAINT "function_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_administration_context"."administrative_position" (
    "id" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "label" TEXT,

    CONSTRAINT "administrative_position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_administration_context"."position" (
    "id" INTEGER NOT NULL,
    "profile" TEXT,
    "profile_id" TEXT,
    "bbis" BOOLEAN NOT NULL DEFAULT false,
    "grade_id" TEXT NOT NULL,
    "function_id" TEXT,
    "jurisdiction_id" TEXT NOT NULL,
    "jurisdiction_type_id" TEXT NOT NULL,

    CONSTRAINT "position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_administration_context"."session" (
    "id" INTEGER NOT NULL,
    "label" TEXT,
    "created_at" DATE NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_administration_context"."candidate" (
    "id" INTEGER NOT NULL,
    "magistrat_id" TEXT NOT NULL,
    "is_joint" BOOLEAN NOT NULL DEFAULT false,
    "spouse" TEXT,
    "comment" TEXT,
    "adr1" TEXT,
    "adr2" TEXT,
    "postal_code" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "mandate" TEXT,
    "spouse_mandate" TEXT,
    "spouse_occupation" TEXT,
    "article_l111" TEXT,
    "observation_session_id" INTEGER,
    "updated_at" DATE,

    CONSTRAINT "candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_administration_context"."candidate_wish" (
    "id" INTEGER NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "position_id" INTEGER NOT NULL,
    "created_at" DATE NOT NULL,

    CONSTRAINT "candidate_wish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_administration_context"."nomination" (
    "id" INTEGER NOT NULL,
    "magistrat_id" TEXT NOT NULL,
    "session_id" INTEGER NOT NULL,
    "targeted_position_id" INTEGER NOT NULL,
    "current_position_id" INTEGER,
    "type" "data_administration_context"."nomination_type_enum" NOT NULL DEFAULT 'EQUIVALENT',
    "is_designated" BOOLEAN NOT NULL DEFAULT false,
    "rank" SMALLINT NOT NULL,
    "last_ranking_date" DATE,
    "last_promotion_year" INTEGER,
    "position_sort" BIGINT NOT NULL,

    CONSTRAINT "nomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."agenda" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "session_name" TEXT NOT NULL,
    "formation" "formation" NOT NULL,
    "session_meeting_date" DATE NOT NULL,
    "date" DATE NOT NULL,
    "official_report_id" UUID,
    "justice_presentation_plan_id" UUID,
    "chairman_id" UUID,
    "chairman_first_name" TEXT NOT NULL,
    "chairman_last_name" TEXT NOT NULL,
    "chairman_title" "nominations_context"."user_title_enum",
    "chairman_display_title" TEXT,
    "chairman_gender" "identity_and_access_context"."gender" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "html" TEXT,
    "is_manually_edited" BOOLEAN NOT NULL DEFAULT false,
    "pdf_file_id" UUID,

    CONSTRAINT "agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."agenda_nomination_file" (
    "id" BIGSERIAL NOT NULL,
    "agenda_id" UUID NOT NULL,
    "nomination_file_id" UUID,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "position" TEXT,
    "targeted_position" TEXT,
    "targeted_grade" TEXT NOT NULL,
    "outcome" "docs"."agenda_file_outcome_enum",
    "outcome_comment" TEXT,
    "reporters" TEXT[] NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_nomination_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."official_report" (
    "id" UUID NOT NULL,
    "session_meeting_date" DATE NOT NULL,
    "session_meeting_starting_time" TIME NOT NULL,
    "session_meeting_ending_time" TIME NOT NULL,
    "has_renunciation" BOOLEAN NOT NULL,
    "html" TEXT,
    "is_manually_edited" BOOLEAN NOT NULL DEFAULT false,
    "pdf_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "justice_department_contact_id" BIGINT,
    "justice_department_contact_name" TEXT NOT NULL,
    "chairman_id" UUID,
    "chairman_first_name" TEXT NOT NULL,
    "chairman_last_name" TEXT NOT NULL,
    "chairman_title" "nominations_context"."user_title_enum",
    "chairman_display_title" TEXT,
    "chairman_gender" "identity_and_access_context"."gender" NOT NULL,
    "secretary_id" UUID,
    "secretary_first_name" TEXT NOT NULL,
    "secretary_last_name" TEXT NOT NULL,
    "secretary_title" "nominations_context"."user_title_enum",
    "secretary_display_title" TEXT,
    "secretary_gender" "identity_and_access_context"."gender" NOT NULL,

    CONSTRAINT "official_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."official_report_member" (
    "id" BIGSERIAL NOT NULL,
    "official_report_id" UUID NOT NULL,
    "is_absent" BOOLEAN NOT NULL,
    "member_id" UUID NOT NULL,
    "gender" "identity_and_access_context"."gender" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "title" TEXT,
    "sort" SMALLINT NOT NULL,

    CONSTRAINT "official_report_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."justice_department_contact" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" UUID,

    CONSTRAINT "justice_department_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."justice_presentation_plan_nomination_file" (
    "id" BIGSERIAL NOT NULL,
    "plan_id" UUID NOT NULL,
    "nomination_file_id" UUID,
    "agenda_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "session_name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "position" TEXT,
    "targeted_position" TEXT,
    "targeted_grade" TEXT NOT NULL,
    "outcome" "docs"."agenda_file_outcome_enum" NOT NULL,
    "outcome_comment" TEXT,
    "reporters" TEXT[] NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "justice_presentation_plan_nomination_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."official_report_nomination_file" (
    "id" BIGSERIAL NOT NULL,
    "official_report_id" UUID NOT NULL,
    "nomination_file_id" UUID,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "position" TEXT,
    "targeted_position" TEXT,
    "targeted_grade" TEXT NOT NULL,
    "outcome" "docs"."agenda_file_outcome_enum" NOT NULL,
    "outcome_comment" TEXT,
    "reporters" TEXT[] NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_report_nomination_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."justice_presentation_plan" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME NOT NULL,
    "end_time" TIME,
    "html" TEXT,
    "is_manually_edited" BOOLEAN NOT NULL DEFAULT false,
    "pdf_id" UUID,
    "has_renunciation" BOOLEAN NOT NULL,
    "is_presented" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "author_id" UUID,
    "chairman_id" UUID,
    "chairman_first_name" TEXT NOT NULL,
    "chairman_last_name" TEXT NOT NULL,
    "chairman_title" "nominations_context"."user_title_enum",
    "chairman_display_title" TEXT,
    "chairman_gender" "identity_and_access_context"."gender" NOT NULL,
    "secretary_id" UUID,
    "secretary_first_name" TEXT NOT NULL,
    "secretary_last_name" TEXT NOT NULL,
    "secretary_title" "nominations_context"."user_title_enum",
    "secretary_display_title" TEXT,
    "secretary_gender" "identity_and_access_context"."gender" NOT NULL,
    "justice_department_contact_id" BIGINT,
    "justice_department_contact_name" TEXT NOT NULL,

    CONSTRAINT "justice_presentation_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."justice_presentation_plan_to_agenda" (
    "plan_id" UUID NOT NULL,
    "agenda_id" UUID NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "justice_presentation_plan_to_agenda_pkey" PRIMARY KEY ("plan_id","agenda_id")
);

-- CreateTable
CREATE TABLE "docs"."justice_presentation_plan_member" (
    "plan_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "is_absent" BOOLEAN NOT NULL,

    CONSTRAINT "justice_presentation_plan_member_pkey" PRIMARY KEY ("plan_id","member_id")
);

-- CreateTable
CREATE TABLE "files_context"."files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR NOT NULL,
    "path" VARCHAR[],
    "bucket" VARCHAR NOT NULL,
    "size_in_bytes" INTEGER,
    "storage_provider" "files_context"."storage_provider" NOT NULL DEFAULT 'SCALEWAY',

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files_context"."file_public_url" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_id" UUID NOT NULL,

    CONSTRAINT "file_public_url_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_and_access_context"."sessions" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "session_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "invalidated_at" TIMESTAMP(6),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "identity_and_access_context"."impersonation" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "sessionId" UUID NOT NULL,
    "impersonated_user_id" UUID NOT NULL,

    CONSTRAINT "impersonation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_and_access_context"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR NOT NULL,
    "last_name" VARCHAR NOT NULL,
    "role" "identity_and_access_context"."role" NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" TEXT NOT NULL,
    "gender" "identity_and_access_context"."gender" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sort" SMALLINT NOT NULL DEFAULT 1000,
    "title" "nominations_context"."user_title_enum",
    "duty" "nominations_context"."user_duty_enum",
    "display_title" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_and_access_context"."openid_request" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "nonce" BYTEA NOT NULL,
    "challenge" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openid_request_pkey" PRIMARY KEY ("provider","id")
);

-- CreateTable
CREATE TABLE "jobs"."ingestion_job" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "status" "jobs"."status_enum" NOT NULL DEFAULT 'IDLE',
    "metadata" JSONB,

    CONSTRAINT "ingestion_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs"."ingestion_job_error" (
    "id" SERIAL NOT NULL,
    "error" TEXT NOT NULL,
    "job_id" INTEGER NOT NULL,

    CONSTRAINT "ingestion_job_error_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs"."ingestion_job_file" (
    "job_id" INTEGER NOT NULL,
    "file_id" UUID NOT NULL,
    "file_sha256" TEXT NOT NULL,
    "status" "jobs"."status_enum" NOT NULL DEFAULT 'IDLE',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "ingestion_job_file_pkey" PRIMARY KEY ("job_id","file_id")
);

-- CreateTable
CREATE TABLE "jobs"."ingestion_job_requirement" (
    "job_id" INTEGER NOT NULL,
    "job_file_id" UUID NOT NULL,
    "required_file_id" UUID NOT NULL,

    CONSTRAINT "ingestion_job_requirement_pkey" PRIMARY KEY ("job_id","job_file_id","required_file_id")
);

-- CreateTable
CREATE TABLE "jobs"."ingestion_job_file_error" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "file_id" UUID NOT NULL,
    "entity_id" TEXT,
    "entity_number" INTEGER,
    "error" TEXT NOT NULL,

    CONSTRAINT "ingestion_job_file_error_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."magistrat" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "external_id" TEXT NOT NULL,
    "civilite" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "married_name" TEXT,
    "used_name" TEXT,
    "marital_status" TEXT,
    "professional_email" TEXT,
    "birth_date" DATE,
    "birth_place" TEXT,
    "birth_department" TEXT,
    "grade" TEXT,
    "grade_date" DATE,
    "current_position_id" TEXT,
    "installation_date" DATE,
    "nomination_date" DATE,
    "advancement_year" INTEGER,
    "career_history" TEXT,
    "admin_position" TEXT,
    "admin_position_prev" TEXT,
    "admin_position_prev_start" DATE,
    "admin_position_prev_end" DATE,
    "admin_position_prev2" TEXT,
    "admin_position_prev2_date" DATE,
    "lolfi_updated_at" DATE,
    "search" TSVECTOR GENERATED ALWAYS AS (
        SETWEIGHT(TO_TSVECTOR('unaccent_fr'::regconfig, LOWER(COALESCE("first_name", ''))), 'A') ||
        SETWEIGHT(TO_TSVECTOR('unaccent_fr'::regconfig, LOWER(COALESCE("used_name", ''))), 'A') ||
        SETWEIGHT(TO_TSVECTOR('unaccent_fr'::regconfig, LOWER(COALESCE("last_name", ''))), 'B') ||
        SETWEIGHT(TO_TSVECTOR('unaccent_fr'::regconfig, LOWER(COALESCE("professional_email", ''))), 'C')
    ) STORED,

    CONSTRAINT "magistrat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."affectation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "statut" "nominations_context"."statut_affectation" NOT NULL DEFAULT 'BROUILLON',
    "date_publication" TIMESTAMP(6),
    "auteur_publication" UUID,

    CONSTRAINT "affectation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."nomination_file_to_reporter" (
    "version_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "nomination_file_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nomination_file_to_reporter_pkey" PRIMARY KEY ("version_id","user_id","nomination_file_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."dossier_de_nomination" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" UUID NOT NULL,
    "priorite" "nominations_context"."priorite_enum",
    "priorities" "nominations_context"."priorite_enum"[] DEFAULT ARRAY[]::"nominations_context"."priorite_enum"[],
    "comment" TEXT,
    "outcome" "nominations_context"."nomination_file_outcome_enum",
    "outcome_comment" TEXT,
    "number" INTEGER,
    "due_date" DATE,
    "rank" TEXT,
    "targeted_grade" TEXT,
    "current_position" TEXT,
    "targeted_position" TEXT,
    "observers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "name" TEXT NOT NULL,
    "grade" TEXT,
    "biography" TEXT,
    "birth_date" DATE,
    "last_ranking_date" DATE,
    "last_position_date" DATE,
    "career_information" TEXT,
    "alert_hidden" BOOLEAN NOT NULL DEFAULT false,
    "sortable_targeted_grade" SMALLINT NOT NULL,
    "search" tsvector GENERATED ALWAYS AS (
        to_tsvector('unaccent_fr'::regconfig, LOWER("name"))
    ) STORED,
    "detected_magistrat_id" UUID,
    "detected_jurisdiction_id" TEXT,
    "detected_targeted_function_id" TEXT,
    "detected_targeted_position_id" INTEGER,

    CONSTRAINT "dossier_de_nomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."nomination_file_attachment" (
    "nomination_file_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "nomination_file_attachment_pkey" PRIMARY KEY ("nomination_file_id","file_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."comment_access" (
    "nomination_file_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_access_pkey" PRIMARY KEY ("nomination_file_id","user_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "formation" "formation" NOT NULL,
    "type_de_saisine" "nominations_context"."type_de_saisine" NOT NULL,
    "session_import_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "observations_closing_date" DATE NOT NULL,
    "due_date" DATE,
    "position_start_date" DATE,
    "lolfi_session_id" INTEGER,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "validated_by" UUID,
    "validated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "archived_at" TIMESTAMP(3),
    "archived_by" UUID,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."session_attachment" (
    "session_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "session_attachment_pkey" PRIMARY KEY ("session_id","file_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."member_memo" (
    "user_id" UUID NOT NULL,
    "nomination_file_id" UUID NOT NULL,
    "memo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "member_memo_pkey" PRIMARY KEY ("user_id","nomination_file_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."summaries" (
    "nomination_file_id" UUID NOT NULL,
    "author_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "summaries_pkey" PRIMARY KEY ("nomination_file_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."summary_readers" (
    "summary_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "summary_readers_pkey" PRIMARY KEY ("user_id","summary_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."summary_attachments" (
    "summary_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "summary_attachments_pkey" PRIMARY KEY ("summary_id","file_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."summary_screenshots" (
    "summary_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "summary_screenshots_pkey" PRIMARY KEY ("summary_id","file_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."observation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomination_file_id" UUID NOT NULL,
    "magistrat_id" UUID NOT NULL,
    "date_reception" DATE NOT NULL,
    "created_by_user_id" UUID,
    "follow_up" "nominations_context"."observation_follow_up_enum",
    "follow_up_comment" TEXT,
    "followed_up_at" TIMESTAMP(3),
    "followed_up_by_user_id" UUID,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."observation_file" (
    "observation_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "original_observation_id" UUID,
    "original_file_id" UUID,

    CONSTRAINT "observation_file_pkey" PRIMARY KEY ("observation_id","file_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."observation_member_comment" (
    "user_id" UUID NOT NULL,
    "observation_id" UUID NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "observation_member_comment_pkey" PRIMARY KEY ("user_id","observation_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."observation_member_comment_screenshot" (
    "user_id" UUID NOT NULL,
    "observation_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "observation_member_comment_screenshot_pkey" PRIMARY KEY ("user_id","observation_id","file_id")
);

-- CreateTable
CREATE TABLE "reports_context"."report_rule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rule_group" "reports_context"."rule_group" NOT NULL,
    "rule_name" "reports_context"."rule_name" NOT NULL,
    "validated" BOOLEAN NOT NULL,
    "report_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports_context"."reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "state" "report_state" NOT NULL DEFAULT 'NEW',
    "comment" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomination_file_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "session_id" UUID NOT NULL,
    "formation" "formation" NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports_context"."report_files" (
    "fileId" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "usage" "reports_context"."report_file_usage_enum" NOT NULL,

    CONSTRAINT "report_files_pkey" PRIMARY KEY ("fileId","reportId")
);

-- CreateIndex
CREATE INDEX "jurisdiction_type_sort_idx" ON "data_administration_context"."jurisdiction_type"("sort");

-- CreateIndex
CREATE INDEX "grade_sort_idx" ON "data_administration_context"."grade"("sort");

-- CreateIndex
CREATE INDEX "function_sort_idx" ON "data_administration_context"."function"("sort");

-- CreateIndex
CREATE INDEX "nomination_position_sort_idx" ON "data_administration_context"."nomination"("position_sort");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_justice_presentation_plan_id_id_key" ON "docs"."agenda"("justice_presentation_plan_id", "id");

-- CreateIndex
CREATE INDEX "justice_presentation_plan_is_presented_idx" ON "docs"."justice_presentation_plan"("is_presented");

-- CreateIndex
CREATE UNIQUE INDEX "justice_presentation_plan_to_agenda_agenda_id_key" ON "docs"."justice_presentation_plan_to_agenda"("agenda_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "identity_and_access_context"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_title_key" ON "identity_and_access_context"."users"("title");

-- CreateIndex
CREATE INDEX "ingestion_job_status_ended_at_idx" ON "jobs"."ingestion_job"("status", "ended_at");

-- CreateIndex
CREATE UNIQUE INDEX "magistrat_external_id_key" ON "nominations_context"."magistrat"("external_id");

-- CreateIndex
CREATE INDEX "magistrat_search_idx_gin" ON "nominations_context"."magistrat" USING GIN ("search");

-- CreateIndex
CREATE INDEX "magistrat_last_name_first_name_idx" ON "nominations_context"."magistrat"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "magistrat_used_name_idx" ON "nominations_context"."magistrat"("used_name");

-- CreateIndex
CREATE INDEX "magistrat_professional_email_idx" ON "nominations_context"."magistrat"("professional_email");

-- CreateIndex
CREATE UNIQUE INDEX "affectation_session_id_version_key" ON "nominations_context"."affectation"("session_id", "version");

-- CreateIndex
CREATE INDEX "nomination_file_to_reporter_nomination_file_id_idx" ON "nominations_context"."nomination_file_to_reporter"("nomination_file_id");

-- CreateIndex
CREATE INDEX "nomination_file_to_reporter_user_id_idx" ON "nominations_context"."nomination_file_to_reporter"("user_id");

-- CreateIndex
CREATE INDEX "dossier_de_nomination_session_id_sortable_targeted_grade_idx" ON "nominations_context"."dossier_de_nomination"("session_id", "sortable_targeted_grade");

-- CreateIndex
CREATE INDEX "nomination_file_search_idx_gin" ON "nominations_context"."dossier_de_nomination" USING GIN ("search");

-- CreateIndex
CREATE UNIQUE INDEX "dossier_de_nomination_session_id_number_key" ON "nominations_context"."dossier_de_nomination"("session_id", "number");

-- CreateIndex
CREATE INDEX "comment_access_user_id_idx" ON "nominations_context"."comment_access"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_session_import_id_unique" ON "nominations_context"."session"("session_import_id");

-- CreateIndex
CREATE INDEX "session_deleted_at_idx" ON "nominations_context"."session"("deleted_at");

-- CreateIndex
CREATE INDEX "session_archived_at_idx" ON "nominations_context"."session"("archived_at");

-- CreateIndex
CREATE INDEX "observation_magistrat_id_idx" ON "nominations_context"."observation"("magistrat_id");

-- CreateIndex
CREATE UNIQUE INDEX "observation_nomination_file_id_magistrat_id_key" ON "nominations_context"."observation"("nomination_file_id", "magistrat_id");

-- CreateIndex
CREATE INDEX "reports_session_id_is_deleted_idx" ON "reports_context"."reports"("session_id", "is_deleted");

-- AddForeignKey
ALTER TABLE "data_administration_context"."excluded_jurisdictions" ADD CONSTRAINT "excluded_jurisdictions_jurisdiction_id_jurisdictions_codejur_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "data_administration_context"."jurisdictions"("codejur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."excluded_jurisdictions" ADD CONSTRAINT "excluded_jurisdictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."grade" ADD CONSTRAINT "grade_mass_grade_id_fkey" FOREIGN KEY ("mass_grade_id") REFERENCES "data_administration_context"."grade"("grade") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."position" ADD CONSTRAINT "position_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "data_administration_context"."grade"("grade") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_administration_context"."position" ADD CONSTRAINT "position_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "data_administration_context"."function"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."position" ADD CONSTRAINT "position_jurisdiction_type_id_fkey" FOREIGN KEY ("jurisdiction_type_id") REFERENCES "data_administration_context"."jurisdiction_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."position" ADD CONSTRAINT "position_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "data_administration_context"."jurisdictions"("codejur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."candidate" ADD CONSTRAINT "candidate_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "nominations_context"."magistrat"("external_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."candidate" ADD CONSTRAINT "candidate_observation_session_id_fkey" FOREIGN KEY ("observation_session_id") REFERENCES "data_administration_context"."session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_administration_context"."candidate_wish" ADD CONSTRAINT "candidate_wish_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "data_administration_context"."candidate"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."candidate_wish" ADD CONSTRAINT "candidate_wish_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "data_administration_context"."position"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."nomination" ADD CONSTRAINT "nomination_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "nominations_context"."magistrat"("external_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."nomination" ADD CONSTRAINT "nomination_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "data_administration_context"."session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."nomination" ADD CONSTRAINT "nomination_targeted_position_id_fkey" FOREIGN KEY ("targeted_position_id") REFERENCES "data_administration_context"."position"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."nomination" ADD CONSTRAINT "nomination_current_position_id_fkey" FOREIGN KEY ("current_position_id") REFERENCES "data_administration_context"."position"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_pdf_file_id_fkey" FOREIGN KEY ("pdf_file_id") REFERENCES "files_context"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_official_report_id_fkey" FOREIGN KEY ("official_report_id") REFERENCES "docs"."official_report"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda_nomination_file" ADD CONSTRAINT "agenda_nomination_file_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "docs"."agenda"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda_nomination_file" ADD CONSTRAINT "agenda_nomination_file_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report" ADD CONSTRAINT "official_report_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report" ADD CONSTRAINT "official_report_secretary_id_fkey" FOREIGN KEY ("secretary_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report" ADD CONSTRAINT "official_report_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report" ADD CONSTRAINT "official_report_justice_department_contact_id_fkey" FOREIGN KEY ("justice_department_contact_id") REFERENCES "docs"."justice_department_contact"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report" ADD CONSTRAINT "official_report_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "files_context"."files"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report_member" ADD CONSTRAINT "official_report_member_official_report_id_fkey" FOREIGN KEY ("official_report_id") REFERENCES "docs"."official_report"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_department_contact" ADD CONSTRAINT "justice_department_contact_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan_nomination_file" ADD CONSTRAINT "justice_presentation_plan_nomination_file_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "docs"."justice_presentation_plan"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan_nomination_file" ADD CONSTRAINT "justice_presentation_plan_nomination_file_nomination_file__fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan_nomination_file" ADD CONSTRAINT "justice_presentation_plan_nomination_file_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "docs"."agenda"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report_nomination_file" ADD CONSTRAINT "official_report_nomination_file_official_report_id_fkey" FOREIGN KEY ("official_report_id") REFERENCES "docs"."official_report"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report_nomination_file" ADD CONSTRAINT "official_report_nomination_file_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan" ADD CONSTRAINT "justice_presentation_plan_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan" ADD CONSTRAINT "justice_presentation_plan_secretary_id_fkey" FOREIGN KEY ("secretary_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan" ADD CONSTRAINT "justice_presentation_plan_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan" ADD CONSTRAINT "justice_presentation_plan_justice_department_contact_id_fkey" FOREIGN KEY ("justice_department_contact_id") REFERENCES "docs"."justice_department_contact"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan" ADD CONSTRAINT "justice_presentation_plan_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "files_context"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan_to_agenda" ADD CONSTRAINT "justice_presentation_plan_to_agenda_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "docs"."justice_presentation_plan"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan_to_agenda" ADD CONSTRAINT "justice_presentation_plan_to_agenda_plan_id_agenda_id_fkey" FOREIGN KEY ("plan_id", "agenda_id") REFERENCES "docs"."agenda"("justice_presentation_plan_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan_member" ADD CONSTRAINT "justice_presentation_plan_member_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "docs"."justice_presentation_plan"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "files_context"."file_public_url" ADD CONSTRAINT "file_public_url_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."impersonation" ADD CONSTRAINT "impersonation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "identity_and_access_context"."sessions"("session_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."impersonation" ADD CONSTRAINT "impersonation_impersonated_user_id_fkey" FOREIGN KEY ("impersonated_user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jobs"."ingestion_job_error" ADD CONSTRAINT "ingestion_job_error_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"."ingestion_job"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jobs"."ingestion_job_file" ADD CONSTRAINT "ingestion_job_file_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"."ingestion_job"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jobs"."ingestion_job_file" ADD CONSTRAINT "ingestion_job_file_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jobs"."ingestion_job_requirement" ADD CONSTRAINT "ingestion_job_requirement_job_id_job_file_id_fkey" FOREIGN KEY ("job_id", "job_file_id") REFERENCES "jobs"."ingestion_job_file"("job_id", "file_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs"."ingestion_job_requirement" ADD CONSTRAINT "ingestion_job_requirement_job_id_required_file_id_fkey" FOREIGN KEY ("job_id", "required_file_id") REFERENCES "jobs"."ingestion_job_file"("job_id", "file_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs"."ingestion_job_file_error" ADD CONSTRAINT "ingestion_job_file_error_job_id_file_id_fkey" FOREIGN KEY ("job_id", "file_id") REFERENCES "jobs"."ingestion_job_file"("job_id", "file_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominations_context"."affectation" ADD CONSTRAINT "affectation_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."affectation" ADD CONSTRAINT "affectation_auteur_publication_fkey" FOREIGN KEY ("auteur_publication") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."nomination_file_to_reporter" ADD CONSTRAINT "nomination_file_to_reporter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."nomination_file_to_reporter" ADD CONSTRAINT "nomination_file_to_reporter_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."nomination_file_to_reporter" ADD CONSTRAINT "nomination_file_to_reporter_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "nominations_context"."affectation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD CONSTRAINT "dossier_de_nomination_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD CONSTRAINT "dossier_de_nomination_detected_magistrat_id_fkey" FOREIGN KEY ("detected_magistrat_id") REFERENCES "nominations_context"."magistrat"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD CONSTRAINT "dossier_de_nomination_detected_jurisdiction_id_fkey" FOREIGN KEY ("detected_jurisdiction_id") REFERENCES "data_administration_context"."jurisdictions"("codejur") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD CONSTRAINT "dossier_de_nomination_detected_targeted_function_id_fkey" FOREIGN KEY ("detected_targeted_function_id") REFERENCES "data_administration_context"."function"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD CONSTRAINT "dossier_de_nomination_detected_targeted_position_id_fkey" FOREIGN KEY ("detected_targeted_position_id") REFERENCES "data_administration_context"."position"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."nomination_file_attachment" ADD CONSTRAINT "nomination_file_attachment_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."nomination_file_attachment" ADD CONSTRAINT "nomination_file_attachment_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."comment_access" ADD CONSTRAINT "comment_access_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."comment_access" ADD CONSTRAINT "comment_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."session" ADD CONSTRAINT "session_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."session" ADD CONSTRAINT "session_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."session" ADD CONSTRAINT "session_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."session_attachment" ADD CONSTRAINT "session_attachment_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."session_attachment" ADD CONSTRAINT "session_attachment_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."member_memo" ADD CONSTRAINT "member_memo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."member_memo" ADD CONSTRAINT "member_memo_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summaries" ADD CONSTRAINT "summaries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summaries" ADD CONSTRAINT "summaries_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_readers" ADD CONSTRAINT "summary_readers_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "nominations_context"."summaries"("nomination_file_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_readers" ADD CONSTRAINT "summary_readers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_attachments" ADD CONSTRAINT "summary_attachments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_attachments" ADD CONSTRAINT "summary_attachments_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "nominations_context"."summaries"("nomination_file_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_screenshots" ADD CONSTRAINT "summary_screenshots_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_screenshots" ADD CONSTRAINT "summary_screenshots_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "nominations_context"."summaries"("nomination_file_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation" ADD CONSTRAINT "observation_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation" ADD CONSTRAINT "observation_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "nominations_context"."magistrat"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation" ADD CONSTRAINT "observation_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation" ADD CONSTRAINT "observation_followed_up_by_user_id_fkey" FOREIGN KEY ("followed_up_by_user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_file" ADD CONSTRAINT "observation_file_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "nominations_context"."observation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_file" ADD CONSTRAINT "observation_file_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_file" ADD CONSTRAINT "observation_file_original_observation_id_original_file_id_fkey" FOREIGN KEY ("original_observation_id", "original_file_id") REFERENCES "nominations_context"."observation_file"("observation_id", "file_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment" ADD CONSTRAINT "observation_member_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment" ADD CONSTRAINT "observation_member_comment_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "nominations_context"."observation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment_screenshot" ADD CONSTRAINT "observation_member_comment_screenshot_user_id_observation__fkey" FOREIGN KEY ("user_id", "observation_id") REFERENCES "nominations_context"."observation_member_comment"("user_id", "observation_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment_screenshot" ADD CONSTRAINT "observation_member_comment_screenshot_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reports_context"."report_rule" ADD CONSTRAINT "report_rule_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "reports_context"."reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reports_context"."reports" ADD CONSTRAINT "reports_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reports_context"."report_files" ADD CONSTRAINT "report_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reports_context"."report_files" ADD CONSTRAINT "report_files_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports_context"."reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
