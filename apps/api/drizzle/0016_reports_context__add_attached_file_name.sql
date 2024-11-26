BEGIN;

ALTER TABLE reports_context.attached_files DROP COLUMN file_id;
ALTER TABLE reports_context.attached_files ADD COLUMN "name" varchar NOT NULL;

COMMIT;