-- AlterEnum
ALTER TYPE "nominations_context"."user_duty_enum" ADD VALUE 'DEPUTY_PRESIDENT';
ALTER TYPE "nominations_context"."user_title_enum" ADD VALUE 'DEPUTY_PRESIDENT_SIEGE';
ALTER TYPE "nominations_context"."user_title_enum" ADD VALUE 'DEPUTY_PRESIDENT_PARQUET';

-- DropForeignKey
ALTER TABLE "docs"."agenda_nomination_file" DROP CONSTRAINT "agenda_nomination_file_nomination_file_id_fkey";

-- AddForeignKey
ALTER TABLE "docs"."agenda_nomination_file" ADD CONSTRAINT "agenda_nomination_file_nomination_file_id_fkey"
  FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
