-- AlterTable
ALTER TABLE "nominations_context"."dossier_de_nomination" ALTER COLUMN "content" SET DEFAULT '{}'::JSONB;

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
CREATE TABLE "nominations_context"."observation_member_comment_file" (
    "user_id" UUID NOT NULL,
    "observation_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "observation_member_comment_file_pkey" PRIMARY KEY ("user_id","observation_id","file_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment" ADD CONSTRAINT "observation_member_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment" ADD CONSTRAINT "observation_member_comment_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "nominations_context"."observation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment_file" ADD CONSTRAINT "observation_member_comment_file_user_id_observation_id_fkey" FOREIGN KEY ("user_id", "observation_id") REFERENCES "nominations_context"."observation_member_comment"("user_id", "observation_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_member_comment_file" ADD CONSTRAINT "observation_member_comment_file_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
