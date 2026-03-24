-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "docs";

-- CreateEnum
CREATE TYPE "docs"."agenda_file_outcome_enum" AS ENUM ('VALIDATED', 'NON_VALIDATED', 'SUSPENDED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "docs"."agenda" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "session_meeting_date" DATE NOT NULL,
    "date" DATE NOT NULL,
    "chairman_id" UUID,
    "chairman_first_name" TEXT NOT NULL,
    "chairman_last_name" TEXT NOT NULL,
    "chairman_title" TEXT,
    "chairman_gender" "identity_and_access_context"."gender" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

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
    "position" TEXT NOT NULL,
    "targeted_position" TEXT NOT NULL,
    "targeted_grade" TEXT NOT NULL,
    "outcome" "docs"."agenda_file_outcome_enum" NOT NULL,
    "outcome_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_nomination_file_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda_nomination_file" ADD CONSTRAINT "agenda_nomination_file_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "docs"."agenda"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda_nomination_file" ADD CONSTRAINT "agenda_nomination_file_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE SET NULL ON UPDATE CASCADE;