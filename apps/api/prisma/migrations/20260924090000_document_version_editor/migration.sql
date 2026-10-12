BEGIN;

-- a draft nobody created nor edited is one the application opened on its own; existing drafts keep a null trace
ALTER TABLE "docs"."agenda_version"
    ADD COLUMN "updated_at" TIMESTAMP(3),
    ADD COLUMN "updated_by" UUID,
    ADD CONSTRAINT "agenda_version_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "docs"."official_report_version"
    ADD COLUMN "updated_at" TIMESTAMP(3),
    ADD COLUMN "updated_by" UUID,
    ADD CONSTRAINT "official_report_version_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;
