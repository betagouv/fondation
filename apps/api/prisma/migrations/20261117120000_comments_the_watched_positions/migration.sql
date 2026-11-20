-- CreateTable
CREATE TABLE "nominations_context"."position_comment" (
    "author_id" UUID,
    "comment" TEXT NOT NULL,
    "magistrat_id" UUID NOT NULL,
    "position_id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_comment_pkey" PRIMARY KEY ("magistrat_id","position_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."position_comment" ADD CONSTRAINT "position_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."position_comment" ADD CONSTRAINT "position_comment_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "data_administration_context"."magistrat"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."position_comment" ADD CONSTRAINT "position_comment_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "data_administration_context"."position"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
