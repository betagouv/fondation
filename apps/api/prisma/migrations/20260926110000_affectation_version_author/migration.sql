BEGIN;

-- the versions opened before keep a null author: nobody knows whose change reopened them
ALTER TABLE "nominations_context"."affectation"
    ADD COLUMN "created_by" UUID,
    ADD CONSTRAINT "affectation_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;
