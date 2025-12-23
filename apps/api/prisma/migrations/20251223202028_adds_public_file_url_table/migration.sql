-- CreateTable
CREATE TABLE "files_context"."file_public_url" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_id" UUID NOT NULL,

    CONSTRAINT "file_public_url_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "files_context"."file_public_url" ADD CONSTRAINT "file_public_url_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
