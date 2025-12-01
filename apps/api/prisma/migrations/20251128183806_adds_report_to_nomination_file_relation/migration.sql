-- AddForeignKey
ALTER TABLE "reports_context"."reports" ADD CONSTRAINT "reports_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
