-- CreateEnum
CREATE TYPE "nominations_context"."call_for_applications_status_enum" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "nominations_context"."call_for_applications_type_enum" AS ENUM ('GENERAL');

-- CreateEnum
CREATE TYPE "nominations_context"."target_jurisdiction_type_enum" AS ENUM ('COURT_OF_APPEAL', 'JUDICIAL_COURT');

-- CreateTable
CREATE TABLE "nominations_context"."call_for_applications" (
    "author_id" UUID,
    "comment" TEXT,
    "created_on" DATE NOT NULL,
    "deadline" DATE,
    "id" UUID NOT NULL,
    "published_on" DATE,
    "status" "nominations_context"."call_for_applications_status_enum" NOT NULL DEFAULT 'UNPUBLISHED',
    "target_jurisdiction_type" "nominations_context"."target_jurisdiction_type_enum",
    "type" "nominations_context"."call_for_applications_type_enum" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_for_applications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."call_for_applications" ADD CONSTRAINT "call_for_applications_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- A general call targets either the courts of appeal or the judicial courts: the other types will target otherwise
ALTER TABLE "nominations_context"."call_for_applications" ADD CONSTRAINT "call_for_applications_general_target_check" CHECK ("type" <> 'GENERAL' OR "target_jurisdiction_type" IS NOT NULL);
