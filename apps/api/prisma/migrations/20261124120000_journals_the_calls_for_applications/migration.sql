-- CreateEnum
CREATE TYPE "nominations_context"."call_for_applications_action_enum" AS ENUM ('CREATED');

-- CreateTable
CREATE TABLE "nominations_context"."call_for_applications_change" (
    "action" "nominations_context"."call_for_applications_action_enum" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "author_id" UUID,
    "call_id" UUID NOT NULL,
    "id" UUID NOT NULL,

    CONSTRAINT "call_for_applications_change_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."call_for_applications_change" ADD CONSTRAINT "call_for_applications_change_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
