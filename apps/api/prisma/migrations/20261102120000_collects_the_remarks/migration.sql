CREATE TYPE "nominations_context"."remark_status_enum" AS ENUM ('NEW', 'PROCESSED', 'DISMISSED');

CREATE TABLE "nominations_context"."remark" (
    "author_id" UUID NOT NULL,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "impersonated_id" UUID,
    "sent_at" TIMESTAMP(6) NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "remark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nominations_context"."remark_status_change" (
    "changed_at" TIMESTAMP(6) NOT NULL,
    "changed_by" UUID,
    "remark_id" UUID NOT NULL,
    "status" "nominations_context"."remark_status_enum" NOT NULL,

    CONSTRAINT "remark_status_change_pkey" PRIMARY KEY ("remark_id","changed_at")
);

ALTER TABLE "nominations_context"."remark" ADD CONSTRAINT "remark_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "nominations_context"."remark" ADD CONSTRAINT "remark_impersonated_id_fkey" FOREIGN KEY ("impersonated_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "nominations_context"."remark_status_change" ADD CONSTRAINT "remark_status_change_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "nominations_context"."remark_status_change" ADD CONSTRAINT "remark_status_change_remark_id_fkey" FOREIGN KEY ("remark_id") REFERENCES "nominations_context"."remark"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
