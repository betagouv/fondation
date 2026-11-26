-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "nominations_context"."call_for_applications_field_enum" ADD VALUE 'COURT_OF_APPEAL_GUIDELINES_ADAPTATION';
ALTER TYPE "nominations_context"."call_for_applications_field_enum" ADD VALUE 'JUDICIAL_COURT_GUIDELINES_ADAPTATION';

-- AlterTable
ALTER TABLE "nominations_context"."call_for_applications" ADD COLUMN     "adapts_court_of_appeal_guidelines" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adapts_judicial_court_guidelines" BOOLEAN NOT NULL DEFAULT false;

