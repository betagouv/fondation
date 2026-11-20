CREATE TYPE "nominations_context"."recusal_action_enum" AS ENUM ('ADDED', 'REMOVED');

CREATE TABLE "nominations_context"."recused_member_change" (
    "action" "nominations_context"."recusal_action_enum" NOT NULL,
    "changed_at" TIMESTAMP(6) NOT NULL,
    "changed_by" UUID,
    "nomination_file_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "recused_member_change_pkey" PRIMARY KEY ("nomination_file_id","user_id","changed_at")
);

ALTER TABLE "nominations_context"."recused_member_change" ADD CONSTRAINT "recused_member_change_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "nominations_context"."recused_member_change" ADD CONSTRAINT "recused_member_change_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "nominations_context"."recused_member_change" ADD CONSTRAINT "recused_member_change_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "nominations_context"."recused_member" DROP CONSTRAINT "recused_member_created_by_fkey";
ALTER TABLE "nominations_context"."recused_member" DROP COLUMN "created_at",
DROP COLUMN "created_by";
