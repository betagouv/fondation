-- CreateTable
CREATE TABLE "nominations_context"."comment_access" (
    "nomination_file_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_access_pkey" PRIMARY KEY ("nomination_file_id","user_id")
);

-- CreateIndex
CREATE INDEX "comment_access_user_id_idx" ON "nominations_context"."comment_access"("user_id");

-- AddForeignKey
ALTER TABLE "nominations_context"."comment_access" ADD CONSTRAINT "comment_access_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."comment_access" ADD CONSTRAINT "comment_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
