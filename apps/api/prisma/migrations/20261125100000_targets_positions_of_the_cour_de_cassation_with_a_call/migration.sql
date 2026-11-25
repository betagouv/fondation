-- AlterEnum
ALTER TYPE "nominations_context"."call_for_applications_type_enum" ADD VALUE 'CCASS';

-- AlterEnum
ALTER TYPE "nominations_context"."call_for_applications_field_enum" ADD VALUE 'TARGET_POSITIONS';

-- CreateEnum
CREATE TYPE "nominations_context"."court_of_cassation_position_enum" AS ENUM ('AUDITOR_FIRST_GRADE', 'AUDITOR_SECOND_GRADE', 'CHAMBER_PRESIDENT', 'COUNSELLOR', 'FIRST_PRESIDENT', 'REFERENDARY_COUNSELLOR');

-- CreateTable
CREATE TABLE "nominations_context"."call_for_applications_target_position" (
    "call_id" UUID NOT NULL,
    "position" "nominations_context"."court_of_cassation_position_enum" NOT NULL,

    CONSTRAINT "call_for_applications_target_position_pkey" PRIMARY KEY ("call_id","position")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."call_for_applications_target_position" ADD CONSTRAINT "call_for_applications_target_position_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "nominations_context"."call_for_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
