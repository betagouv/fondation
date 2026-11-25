-- CreateEnum
CREATE TYPE "nominations_context"."call_for_applications_field_change_enum" AS ENUM ('ADDED', 'CHANGED', 'REMOVED');

-- AlterTable
ALTER TABLE "nominations_context"."call_for_applications_changed_field" ADD COLUMN     "date_after" DATE,
ADD COLUMN     "date_before" DATE,
ADD COLUMN     "field_change" "nominations_context"."call_for_applications_field_change_enum" NOT NULL DEFAULT 'CHANGED',
ADD COLUMN     "type_after" "nominations_context"."call_for_applications_type_enum",
ADD COLUMN     "type_before" "nominations_context"."call_for_applications_type_enum";

-- CreateTable
CREATE TABLE "nominations_context"."call_for_applications_changed_court" (
    "change_id" UUID NOT NULL,
    "court_id" TEXT NOT NULL,
    "field_change" "nominations_context"."call_for_applications_field_change_enum" NOT NULL,

    CONSTRAINT "call_for_applications_changed_court_pkey" PRIMARY KEY ("change_id","court_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."call_for_applications_changed_position" (
    "change_id" UUID NOT NULL,
    "field_change" "nominations_context"."call_for_applications_field_change_enum" NOT NULL,
    "position" "nominations_context"."court_of_cassation_position_enum" NOT NULL,

    CONSTRAINT "call_for_applications_changed_position_pkey" PRIMARY KEY ("change_id","position")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."call_for_applications_changed_court" ADD CONSTRAINT "call_for_applications_changed_court_change_id_fkey" FOREIGN KEY ("change_id") REFERENCES "nominations_context"."call_for_applications_change"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."call_for_applications_changed_court" ADD CONSTRAINT "call_for_applications_changed_court_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "data_administration_context"."jurisdictions"("codejur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."call_for_applications_changed_position" ADD CONSTRAINT "call_for_applications_changed_position_change_id_fkey" FOREIGN KEY ("change_id") REFERENCES "nominations_context"."call_for_applications_change"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

