BEGIN;

-- CreateTable
CREATE TABLE "nominations_context"."summaries" (
    "nomination_file_id" UUID NOT NULL,
    "author_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "summaries_pkey" PRIMARY KEY ("nomination_file_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."summary_readers" (
    "summary_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "summary_readers_pkey" PRIMARY KEY ("user_id","summary_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."summary_attachments" (
    "summary_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "summary_attachments_pkey" PRIMARY KEY ("summary_id","file_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."summary_screenshots" (
    "summary_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "summary_screenshots_pkey" PRIMARY KEY ("summary_id","file_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."summaries" ADD CONSTRAINT "summaries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summaries" ADD CONSTRAINT "summaries_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_readers" ADD CONSTRAINT "summary_readers_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "nominations_context"."summaries"("nomination_file_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_readers" ADD CONSTRAINT "summary_readers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_attachments" ADD CONSTRAINT "summary_attachments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_attachments" ADD CONSTRAINT "summary_attachments_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "nominations_context"."summaries"("nomination_file_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_screenshots" ADD CONSTRAINT "summary_screenshots_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."summary_screenshots" ADD CONSTRAINT "summary_screenshots_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "nominations_context"."summaries"("nomination_file_id") ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT;
