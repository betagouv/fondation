-- CreateEnum
CREATE TYPE "jobs"."severity_enum" AS ENUM ('ERROR', 'WARNING');

-- AlterTable
ALTER TABLE "jobs"."ingestion_job_error" ADD COLUMN     "severity" "jobs"."severity_enum" NOT NULL DEFAULT 'ERROR';

-- AlterTable
ALTER TABLE "jobs"."ingestion_job_file_error" ADD COLUMN     "severity" "jobs"."severity_enum" NOT NULL DEFAULT 'ERROR';

-- The messages written before the severity existed are recognised by their wording at the time
UPDATE "jobs"."ingestion_job_error"
SET "severity" = 'WARNING'
WHERE "error" LIKE 'Transparence "%" (%) du __/__/____: %';

UPDATE "jobs"."ingestion_job_file_error"
SET "severity" = 'WARNING'
WHERE "error" LIKE '%. La première occurrence est la seule sauvegardée';
