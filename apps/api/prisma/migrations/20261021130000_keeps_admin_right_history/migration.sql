CREATE TYPE "identity_and_access_context"."admin_right_change_enum" AS ENUM ('GRANTED', 'REVOKED');

CREATE TABLE "identity_and_access_context"."admin_right_changes" (
    "user_id" UUID NOT NULL,
    "changed_at" TIMESTAMP(6) NOT NULL,
    "change" "identity_and_access_context"."admin_right_change_enum" NOT NULL,
    "changed_by" UUID,

    CONSTRAINT "admin_right_changes_pkey" PRIMARY KEY ("user_id","changed_at")
);

ALTER TABLE "identity_and_access_context"."admin_right_changes" ADD CONSTRAINT "admin_right_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "identity_and_access_context"."admin_right_changes" ADD CONSTRAINT "admin_right_changes_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
