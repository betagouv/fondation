/*
  Warnings:

  - Made the column `magistrat_id` on table `observation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "nominations_context"."observation" DROP CONSTRAINT "observation_magistrat_id_fkey";

-- AlterTable
ALTER TABLE "nominations_context"."dossier_de_nomination" ALTER COLUMN "content" SET DEFAULT '{}'::JSONB;

-- AlterTable
ALTER TABLE "nominations_context"."observation" ALTER COLUMN "magistrat_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation" ADD CONSTRAINT "observation_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "nominations_context"."magistrat"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
