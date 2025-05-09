BEGIN;

ALTER TABLE "data_administration_context"."transparences" ALTER COLUMN "id" SET DATA TYPE uuid;
ALTER TABLE "data_administration_context"."transparences" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "data_administration_context"."transparences" ADD COLUMN "name" "transparency" NOT NULL;
ALTER TABLE "reports_context"."reports" ADD COLUMN "session_id" uuid NOT NULL;
ALTER TABLE "reports_context"."report_rule" DROP COLUMN "pre_validated";
ALTER TABLE "reports_context"."reports" DROP COLUMN "folder_number";
ALTER TABLE "reports_context"."reports" DROP COLUMN "biography";
ALTER TABLE "reports_context"."reports" DROP COLUMN "due_date";
ALTER TABLE "reports_context"."reports" DROP COLUMN "name";
ALTER TABLE "reports_context"."reports" DROP COLUMN "birth_date";
ALTER TABLE "reports_context"."reports" DROP COLUMN "transparency";
ALTER TABLE "reports_context"."reports" DROP COLUMN "grade";
ALTER TABLE "reports_context"."reports" DROP COLUMN "current_position";
ALTER TABLE "reports_context"."reports" DROP COLUMN "targetted_position";
ALTER TABLE "reports_context"."reports" DROP COLUMN "rank";
ALTER TABLE "reports_context"."reports" DROP COLUMN "observers";
ALTER TABLE "data_administration_context"."transparences" ADD CONSTRAINT "transparences_name_unique" UNIQUE("name");
DROP TYPE "public"."grade";

COMMIT;