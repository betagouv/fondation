ALTER TYPE "nominations_context"."remark_status_enum" RENAME TO "feedback_status_enum";

ALTER TABLE "nominations_context"."remark" RENAME TO "feedback";
ALTER TABLE "nominations_context"."feedback" RENAME CONSTRAINT "remark_pkey" TO "feedback_pkey";
ALTER TABLE "nominations_context"."feedback" RENAME CONSTRAINT "remark_author_id_fkey" TO "feedback_author_id_fkey";
ALTER TABLE "nominations_context"."feedback" RENAME CONSTRAINT "remark_impersonated_id_fkey" TO "feedback_impersonated_id_fkey";
ALTER TABLE "nominations_context"."feedback" RENAME CONSTRAINT "remark_status_changed_by_fkey" TO "feedback_status_changed_by_fkey";

ALTER TABLE "nominations_context"."remark_status_change" RENAME TO "feedback_status_change";
ALTER TABLE "nominations_context"."feedback_status_change" RENAME COLUMN "remark_id" TO "feedback_id";
ALTER TABLE "nominations_context"."feedback_status_change" RENAME CONSTRAINT "remark_status_change_pkey" TO "feedback_status_change_pkey";
ALTER TABLE "nominations_context"."feedback_status_change" RENAME CONSTRAINT "remark_status_change_changed_by_fkey" TO "feedback_status_change_changed_by_fkey";
ALTER TABLE "nominations_context"."feedback_status_change" RENAME CONSTRAINT "remark_status_change_remark_id_fkey" TO "feedback_status_change_feedback_id_fkey";
