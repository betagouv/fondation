BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "jobs";

-- CreateEnum
CREATE TYPE "jobs"."status_enum" AS ENUM ('IDLE', 'RUNNING', 'FAILED', 'SUCCEEDED');

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
CREATE TABLE "jobs"."ingestion_job" (
    "id" SERIAL NOT NULL,
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
    "error" TEXT NOT NULL,

    CONSTRAINT "ingestion_job_file_error_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jurisdiction_type_sort_idx" ON "data_administration_context"."jurisdiction_type"("sort");

-- CreateIndex
CREATE INDEX "grade_sort_idx" ON "data_administration_context"."grade"("sort");

-- CreateIndex
CREATE INDEX "ingestion_job_status_ended_at_idx" ON "jobs"."ingestion_job"("status", "ended_at");

-- AddForeignKey
ALTER TABLE "data_administration_context"."grade" ADD CONSTRAINT "grade_mass_grade_id_fkey" FOREIGN KEY ("mass_grade_id") REFERENCES "data_administration_context"."grade"("grade") ON DELETE SET NULL ON UPDATE NO ACTION;

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

COMMIT;