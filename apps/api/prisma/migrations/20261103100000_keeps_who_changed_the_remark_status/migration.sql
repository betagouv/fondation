ALTER TABLE "nominations_context"."remark" ADD COLUMN "status_changed_by" UUID;

ALTER TABLE "nominations_context"."remark" ADD CONSTRAINT "remark_status_changed_by_fkey" FOREIGN KEY ("status_changed_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- The remarks already processed or dismissed take the author of their last change from the history
UPDATE "nominations_context"."remark" AS "remark"
SET "status_changed_by" = (
  SELECT "change"."changed_by"
  FROM "nominations_context"."remark_status_change" AS "change"
  WHERE "change"."remark_id" = "remark"."id"
  ORDER BY "change"."changed_at" DESC
  LIMIT 1
);
