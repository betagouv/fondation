-- CreateEnum
CREATE TYPE "nominations_context"."call_for_applications_status_enum" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "nominations_context"."call_for_applications_type_enum" AS ENUM ('GENERAL');

-- CreateTable
CREATE TABLE "nominations_context"."call_for_applications" (
    "comment" TEXT,
    "created_on" DATE NOT NULL,
    "deadline" DATE,
    "id" UUID NOT NULL,
    "published_on" DATE,
    "status" "nominations_context"."call_for_applications_status_enum" NOT NULL DEFAULT 'UNPUBLISHED',
    "type" "nominations_context"."call_for_applications_type_enum" NOT NULL,

    CONSTRAINT "call_for_applications_pkey" PRIMARY KEY ("id")
);

