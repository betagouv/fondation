BEGIN;

-- AlterTable
ALTER TABLE "docs"."official_report_member" ALTER COLUMN "member_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "docs"."justice_presentation_plan_member" (
    "plan_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "is_absent" BOOLEAN NOT NULL,

    CONSTRAINT "justice_presentation_plan_member_pkey" PRIMARY KEY ("plan_id","member_id")
);

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan_member"
  ADD CONSTRAINT "justice_presentation_plan_member_plan_id_fkey" FOREIGN KEY ("plan_id")
  REFERENCES "docs"."justice_presentation_plan"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT;
