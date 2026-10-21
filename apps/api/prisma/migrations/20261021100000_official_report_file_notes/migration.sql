ALTER TABLE "docs"."official_report_nomination_file"
    ADD COLUMN "note" TEXT,
    ADD COLUMN "note_edited_at" TIMESTAMP(3),
    ADD COLUMN "note_edited_by" UUID,
    ADD CONSTRAINT "official_report_nomination_file_note_edited_by_fkey" FOREIGN KEY ("note_edited_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
