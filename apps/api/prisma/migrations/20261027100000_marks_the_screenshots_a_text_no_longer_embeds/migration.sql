BEGIN;

-- A screenshot removed from a text is marked rather than deleted: the writer can bring it back, and the cleanup of the unused files purges it later
ALTER TABLE "nominations_context"."help_page_screenshots" ADD COLUMN "detached_at" TIMESTAMP(3);
ALTER TABLE "nominations_context"."summary_screenshots" ADD COLUMN "detached_at" TIMESTAMP(3);
ALTER TABLE "reports_context"."report_files" ADD COLUMN "detached_at" TIMESTAMP(3);
ALTER TABLE "nominations_context"."observation_member_comment_screenshot" ADD COLUMN "detached_at" TIMESTAMP(3);

COMMIT;
