BEGIN;

-- the drafts that already exist keep no trace of the application changing them
ALTER TABLE "docs"."agenda_version" ADD COLUMN "system_updated_at" TIMESTAMP(3);

ALTER TABLE "docs"."official_report_version" ADD COLUMN "system_updated_at" TIMESTAMP(3);

COMMIT;
