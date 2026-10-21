CREATE TYPE "identity_and_access_context"."user_status_enum" AS ENUM ('ACTIVE', 'DEACTIVATED');

CREATE TABLE "identity_and_access_context"."user_status_changes" (
    "user_id" UUID NOT NULL,
    "changed_at" TIMESTAMP(6) NOT NULL,
    "status" "identity_and_access_context"."user_status_enum" NOT NULL,
    "changed_by" UUID,

    CONSTRAINT "user_status_changes_pkey" PRIMARY KEY ("user_id","changed_at")
);

ALTER TABLE "identity_and_access_context"."user_status_changes" ADD CONSTRAINT "user_status_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "identity_and_access_context"."user_status_changes" ADD CONSTRAINT "user_status_changes_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Only the last deactivation of an account was kept: the reactivations before it are lost
INSERT INTO "identity_and_access_context"."user_status_changes" ("user_id", "changed_at", "status", "changed_by")
SELECT "id", "deactivated_at", 'DEACTIVATED', "deactivated_by"
FROM "identity_and_access_context"."users"
WHERE "deactivated_at" IS NOT NULL;

ALTER TABLE "identity_and_access_context"."users" DROP CONSTRAINT "users_deactivated_by_fkey";
ALTER TABLE "identity_and_access_context"."users" DROP COLUMN "deactivated_by";
