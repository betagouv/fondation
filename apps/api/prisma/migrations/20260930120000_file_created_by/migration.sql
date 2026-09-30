BEGIN;

ALTER TABLE "files_context"."files" ADD COLUMN "created_by_id" UUID;

ALTER TABLE "files_context"."files"
    ADD CONSTRAINT "files_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;
