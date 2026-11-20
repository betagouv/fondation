ALTER TABLE "nominations_context"."feedback" RENAME TO "survey";
ALTER TABLE "nominations_context"."survey" RENAME CONSTRAINT "feedback_pkey" TO "survey_pkey";
ALTER TABLE "nominations_context"."survey" RENAME CONSTRAINT "feedback_user_id_fkey" TO "survey_user_id_fkey";

ALTER TABLE "nominations_context"."member_feedback" RENAME TO "member_survey";
ALTER TABLE "nominations_context"."member_survey" RENAME COLUMN "feedback_id" TO "survey_id";
ALTER TABLE "nominations_context"."member_survey" RENAME CONSTRAINT "member_feedback_pkey" TO "member_survey_pkey";
ALTER TABLE "nominations_context"."member_survey" RENAME CONSTRAINT "member_feedback_feedback_id_fkey" TO "member_survey_survey_id_fkey";

ALTER TABLE "nominations_context"."secretariat_feedback" RENAME TO "secretariat_survey";
ALTER TABLE "nominations_context"."secretariat_survey" RENAME COLUMN "feedback_id" TO "survey_id";
ALTER TABLE "nominations_context"."secretariat_survey" RENAME CONSTRAINT "secretariat_feedback_pkey" TO "secretariat_survey_pkey";
ALTER TABLE "nominations_context"."secretariat_survey" RENAME CONSTRAINT "secretariat_feedback_feedback_id_fkey" TO "secretariat_survey_survey_id_fkey";
