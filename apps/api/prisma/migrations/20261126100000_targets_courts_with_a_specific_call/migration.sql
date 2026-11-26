-- AlterEnum
ALTER TYPE "nominations_context"."call_for_applications_field_enum" ADD VALUE 'TARGET_COURTS';

-- AlterEnum
ALTER TYPE "nominations_context"."call_for_applications_type_enum" ADD VALUE 'SPECIFIC';

-- CreateTable
CREATE TABLE "nominations_context"."call_for_applications_target_court" (
    "call_id" UUID NOT NULL,
    "court_id" TEXT NOT NULL,

    CONSTRAINT "call_for_applications_target_court_pkey" PRIMARY KEY ("call_id","court_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."call_for_applications_target_court" ADD CONSTRAINT "call_for_applications_target_court_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "nominations_context"."call_for_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."call_for_applications_target_court" ADD CONSTRAINT "call_for_applications_target_court_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "data_administration_context"."jurisdictions"("codejur") ON DELETE CASCADE ON UPDATE NO ACTION;

