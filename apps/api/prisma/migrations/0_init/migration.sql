-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "data_administration_context";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "files_context";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity_and_access_context";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "nominations_context";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "reports_context";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "shared_kernel_context";

-- CreateEnum
CREATE TYPE "files_context"."storage_provider" AS ENUM ('SCALEWAY');

-- CreateEnum
CREATE TYPE "identity_and_access_context"."file_type" AS ENUM ('PIECE_JOINTE_TRANSPARENCE', 'PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET', 'PIECE_JOINTE_TRANSPARENCE_POUR_SIEGE');

-- CreateEnum
CREATE TYPE "identity_and_access_context"."gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "identity_and_access_context"."role" AS ENUM ('MEMBRE_DU_SIEGE', 'MEMBRE_DU_PARQUET', 'MEMBRE_COMMUN', 'ADJOINT_SECRETAIRE_GENERAL');

-- CreateEnum
CREATE TYPE "nominations_context"."type_de_saisine" AS ENUM ('TRANSPARENCE_GDS');

-- CreateEnum
CREATE TYPE "nominations_context"."statut_affectation" AS ENUM ('BROUILLON', 'PUBLIEE');

-- CreateEnum
CREATE TYPE "public"."formation" AS ENUM ('PARQUET', 'SIEGE');

-- CreateEnum
CREATE TYPE "public"."transparency" AS ENUM ('AUTOMNE_2024', 'PROCUREURS_GENERAUX_25_NOVEMBRE_2024', 'TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024', 'CABINET_DU_MINISTRE_DU_21_JANVIER_2025', 'SIEGE_DU_06_FEVRIER_2025', 'PARQUET_DU_06_FEVRIER_2025', 'PARQUET_DU_20_FEVRIER_2025', 'DU_03_MARS_2025', 'GRANDE_TRANSPA_DU_21_MARS_2025', 'DU_30_AVRIL_2025', 'MARCH_2026', 'PROCUREURS_GENERAUX_8_NOVEMBRE_2024');

-- CreateEnum
CREATE TYPE "reports_context"."rule_group" AS ENUM ('management', 'statutory', 'qualitative');

-- CreateEnum
CREATE TYPE "reports_context"."rule_name" AS ENUM ('TRANSFER_TIME', 'GETTING_GRADE_IN_PLACE', 'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT', 'JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION', 'GRADE_ON_SITE_AFTER_7_YEARS', 'MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS', 'MINISTER_CABINET', 'GRADE_REGISTRATION', 'HH_WITHOUT_2_FIRST_GRADE_POSITIONS', 'LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO', 'RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS', 'NOMINATION_CA_AVANT_4_ANS', 'CONFLICT_OF_INTEREST_PRE_MAGISTRATURE', 'CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION', 'EVALUATIONS', 'DISCIPLINARY_ELEMENTS');

-- CreateEnum
CREATE TYPE "public"."report_state" AS ENUM ('NEW', 'IN_PROGRESS', 'READY_TO_SUPPORT', 'SUPPORTED');

-- CreateEnum
CREATE TYPE "shared_kernel_context"."domain_event_status" AS ENUM ('NEW', 'PENDING', 'CONSUMED');

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
CREATE TABLE "data_administration_context"."nomination_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "row_number" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nomination_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_administration_context"."transparence_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transparence_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transparence_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_administration_context"."transparences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formation" "public"."formation" NOT NULL,
    "nomination_files" JSONB[],
    "date_transparence" TIMESTAMP(6) NOT NULL,
    "date_echeance" TIMESTAMP(6),
    "date_prise_de_poste" TIMESTAMP(6),
    "date_cloture_delai_observation" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "transparences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files_context"."files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR NOT NULL,
    "path" VARCHAR[],
    "storage_provider" "files_context"."storage_provider" NOT NULL,
    "bucket" VARCHAR NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_and_access_context"."files" (
    "file_id" UUID NOT NULL,
    "type" "identity_and_access_context"."file_type" NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("file_id")
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
CREATE TABLE "identity_and_access_context"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR NOT NULL,
    "last_name" VARCHAR NOT NULL,
    "role" "identity_and_access_context"."role" NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" TEXT NOT NULL,
    "gender" "identity_and_access_context"."gender" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."affectation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" UUID NOT NULL,
    "formation" "public"."formation" NOT NULL,
    "affectations_dossiers_de_nominations" JSONB[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "statut" "nominations_context"."statut_affectation" NOT NULL DEFAULT 'BROUILLON',
    "date_publication" TIMESTAMP(6),
    "auteur_publication" UUID,

    CONSTRAINT "affectation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."dossier_de_nomination" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" UUID NOT NULL,
    "dossier_de_nomination_import_id" UUID NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "dossier_de_nomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."pre_analyse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dossier_de_nomination_id" UUID NOT NULL,
    "regles" JSONB[],

    CONSTRAINT "pre_analyse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "formation" "public"."formation" NOT NULL,
    "type_de_saisine" "nominations_context"."type_de_saisine" NOT NULL,
    "session_import_id" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{"dateTransparence": null, "dateClôtureDélaiObservation": null}',

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
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
    "state" "public"."report_state" NOT NULL DEFAULT 'NEW',
    "formation" "public"."formation" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomination_file_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "attached_files" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "session_id" UUID NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_kernel_context"."domain_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_on" TIMESTAMP(6) NOT NULL,
    "status" "shared_kernel_context"."domain_event_status" NOT NULL,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transparences_name_formation_date_transparence_unique" ON "data_administration_context"."transparences"("name", "formation", "date_transparence");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "identity_and_access_context"."users"("email");

-- CreateIndex
CREATE INDEX "idx_affectation_session_version" ON "nominations_context"."affectation"("session_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "affectation_session_id_version_index" ON "nominations_context"."affectation"("session_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "dossier_de_nomination_dossier_de_nomination_import_id_unique" ON "nominations_context"."dossier_de_nomination"("dossier_de_nomination_import_id");

-- CreateIndex
CREATE UNIQUE INDEX "pre_analyse_dossier_de_nomination_id_unique" ON "nominations_context"."pre_analyse"("dossier_de_nomination_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_session_import_id_unique" ON "nominations_context"."session"("session_import_id");

-- AddForeignKey
ALTER TABLE "data_administration_context"."excluded_jurisdictions" ADD CONSTRAINT "excluded_jurisdictions_jurisdiction_id_jurisdictions_codejur_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "data_administration_context"."jurisdictions"("codejur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."excluded_jurisdictions" ADD CONSTRAINT "excluded_jurisdictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."transparence_files" ADD CONSTRAINT "transparence_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_administration_context"."transparence_files" ADD CONSTRAINT "transparence_files_transparence_id_transparences_id_fk" FOREIGN KEY ("transparence_id") REFERENCES "data_administration_context"."transparences"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reports_context"."report_rule" ADD CONSTRAINT "report_rule_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "reports_context"."reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE EXTENSION IF NOT EXISTS unaccent;