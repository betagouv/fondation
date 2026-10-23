BEGIN;

-- Written by hand: Prisma would drop then recreate both tables, losing the messages of every past job
ALTER TABLE "jobs"."ingestion_job_error" RENAME TO "ingestion_job_message";
ALTER TABLE "jobs"."ingestion_job_message" RENAME COLUMN "error" TO "text";
ALTER TABLE "jobs"."ingestion_job_message" RENAME CONSTRAINT "ingestion_job_error_pkey" TO "ingestion_job_message_pkey";
ALTER TABLE "jobs"."ingestion_job_message" RENAME CONSTRAINT "ingestion_job_error_job_id_fkey" TO "ingestion_job_message_job_id_fkey";
ALTER SEQUENCE "jobs"."ingestion_job_error_id_seq" RENAME TO "ingestion_job_message_id_seq";

ALTER TABLE "jobs"."ingestion_job_file_error" RENAME TO "ingestion_job_file_message";
ALTER TABLE "jobs"."ingestion_job_file_message" RENAME COLUMN "error" TO "text";
ALTER TABLE "jobs"."ingestion_job_file_message" RENAME CONSTRAINT "ingestion_job_file_error_pkey" TO "ingestion_job_file_message_pkey";
ALTER TABLE "jobs"."ingestion_job_file_message" RENAME CONSTRAINT "ingestion_job_file_error_job_id_file_id_fkey" TO "ingestion_job_file_message_job_id_file_id_fkey";
ALTER SEQUENCE "jobs"."ingestion_job_file_error_id_seq" RENAME TO "ingestion_job_file_message_id_seq";

COMMIT;
