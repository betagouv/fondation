ALTER TABLE "identity_and_access_context"."users" ADD COLUMN "deactivated_at" TIMESTAMP(6);
ALTER TABLE "identity_and_access_context"."users" ADD COLUMN "deactivated_by" UUID;

ALTER TABLE "identity_and_access_context"."users" ADD CONSTRAINT "users_deactivated_by_fkey" FOREIGN KEY ("deactivated_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
