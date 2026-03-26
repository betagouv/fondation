-- AlterTable
ALTER TABLE "docs"."agenda"
  ADD COLUMN     "html" TEXT,
  ADD COLUMN     "pdf_file_id" UUID;

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_pdf_file_id_fkey" FOREIGN KEY ("pdf_file_id") REFERENCES "files_context"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
