-- AlterTable
ALTER TABLE "nominations_context"."dossier_de_nomination" ALTER COLUMN "content" SET DEFAULT '{}'::JSONB;

-- CreateTable
CREATE TABLE "nominations_context"."observation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomination_file_id" UUID NOT NULL,
    "magistrat_id" UUID,
    "date_reception" DATE NOT NULL,
    "created_by_user_id" UUID,

    CONSTRAINT "observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations_context"."observation_file" (
    "observation_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "observation_file_pkey" PRIMARY KEY ("observation_id","file_id")
);

-- CreateIndex
CREATE INDEX "observation_nomination_file_id_idx" ON "nominations_context"."observation"("nomination_file_id");

-- CreateIndex
CREATE INDEX "observation_magistrat_id_idx" ON "nominations_context"."observation"("magistrat_id");

-- AddForeignKey
ALTER TABLE "nominations_context"."observation" ADD CONSTRAINT "observation_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation" ADD CONSTRAINT "observation_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "nominations_context"."magistrat"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation" ADD CONSTRAINT "observation_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_file" ADD CONSTRAINT "observation_file_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "nominations_context"."observation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_file" ADD CONSTRAINT "observation_file_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
