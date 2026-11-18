BEGIN;

-- the complements written before stay without a version: nobody knows who wrote them nor when
CREATE TABLE "nominations_context"."nomination_file_comment_version" (
    "nomination_file_id" UUID NOT NULL,
    "written_at" TIMESTAMP(3) NOT NULL,
    "written_by" UUID,
    "impersonator_id" UUID,
    "comment" TEXT,

    CONSTRAINT "nomination_file_comment_version_pkey" PRIMARY KEY ("nomination_file_id","written_at")
);

ALTER TABLE "nominations_context"."nomination_file_comment_version" ADD CONSTRAINT "nomination_file_comment_version_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "nominations_context"."nomination_file_comment_version" ADD CONSTRAINT "nomination_file_comment_version_written_by_fkey" FOREIGN KEY ("written_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "nominations_context"."nomination_file_comment_version" ADD CONSTRAINT "nomination_file_comment_version_impersonator_id_fkey" FOREIGN KEY ("impersonator_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;
