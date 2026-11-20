CREATE TABLE "nominations_context"."recused_member" (
    "nomination_file_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "recused_member_pkey" PRIMARY KEY ("nomination_file_id","user_id")
);

ALTER TABLE "nominations_context"."recused_member" ADD CONSTRAINT "recused_member_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "nominations_context"."recused_member" ADD CONSTRAINT "recused_member_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "nominations_context"."recused_member" ADD CONSTRAINT "recused_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
