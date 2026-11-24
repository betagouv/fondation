-- AlterEnum
ALTER TYPE "nominations_context"."call_for_applications_action_enum" ADD VALUE 'DELETED';
ALTER TYPE "nominations_context"."call_for_applications_action_enum" ADD VALUE 'UPDATED';

-- CreateEnum
CREATE TYPE "nominations_context"."call_for_applications_field_enum" AS ENUM ('COMMENT', 'DEADLINE', 'PUBLISHED_ON', 'TARGET_JURISDICTION_TYPE', 'TYPE');

-- CreateTable
CREATE TABLE "nominations_context"."call_for_applications_changed_field" (
    "change_id" UUID NOT NULL,
    "field" "nominations_context"."call_for_applications_field_enum" NOT NULL,

    CONSTRAINT "call_for_applications_changed_field_pkey" PRIMARY KEY ("change_id","field")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."call_for_applications_changed_field" ADD CONSTRAINT "call_for_applications_changed_field_change_id_fkey" FOREIGN KEY ("change_id") REFERENCES "nominations_context"."call_for_applications_change"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
