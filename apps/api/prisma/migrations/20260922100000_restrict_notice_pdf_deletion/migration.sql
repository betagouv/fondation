BEGIN;

-- the stored pdf is what leaves the application, so the database refuses to drop the file
-- a notice still points at, the way it now does for the agenda and the official report
ALTER TABLE "docs"."justice_presentation_plan"
    DROP CONSTRAINT "justice_presentation_plan_pdf_id_fkey",
    ADD CONSTRAINT "justice_presentation_plan_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "files_context"."files" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

COMMIT;
