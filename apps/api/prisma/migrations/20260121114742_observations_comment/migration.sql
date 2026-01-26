/*
  Warnings:

  - Made the column `magistrat_id` on table `observation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "nominations_context"."observation" DROP CONSTRAINT "observation_magistrat_id_fkey";

-- AlterTable
ALTER TABLE "nominations_context"."observation" ALTER COLUMN "magistrat_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation" ADD CONSTRAINT "observation_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "nominations_context"."magistrat"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- CreateTable
CREATE TABLE "nominations_context"."observation_member_comment" (
    "user_id" UUID NOT NULL,
    "observation_id" UUID NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "observation_member_comment_pkey" PRIMARY KEY ("user_id","observation_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."observation_member_comment_screenshot" (
    "user_id" UUID NOT NULL,
    "observation_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "observation_member_comment_screenshot_pkey" PRIMARY KEY ("user_id","observation_id","file_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment" ADD CONSTRAINT "observation_member_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment" ADD CONSTRAINT "observation_member_comment_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "nominations_context"."observation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment_screenshot" ADD CONSTRAINT "observation_member_comment_screenshot_user_id_observation_id_fkey" FOREIGN KEY ("user_id", "observation_id") REFERENCES "nominations_context"."observation_member_comment"("user_id", "observation_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment_screenshot" ADD CONSTRAINT "observation_member_comment_screenshot_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
