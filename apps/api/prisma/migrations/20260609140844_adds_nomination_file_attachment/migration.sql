-- CreateTable
CREATE TABLE "nominations_context"."nomination_file_attachment" (
    "nomination_file_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "nomination_file_attachment_pkey" PRIMARY KEY ("nomination_file_id","file_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."nomination_file_attachment" ADD CONSTRAINT "nomination_file_attachment_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."nomination_file_attachment" ADD CONSTRAINT "nomination_file_attachment_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
