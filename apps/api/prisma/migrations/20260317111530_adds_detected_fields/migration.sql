BEGIN;

-- AlterTable
ALTER TABLE "nominations_context"."dossier_de_nomination"
  ADD COLUMN     "detected_jurisdiction_id" TEXT,
  ADD COLUMN     "detected_magistrat_id" UUID,
  ADD COLUMN     "detected_targeted_function_id" TEXT,
  ADD COLUMN     "detected_targeted_position_id" INTEGER;

-- AddForeignKey
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD CONSTRAINT "dossier_de_nomination_detected_magistrat_id_fkey" FOREIGN KEY ("detected_magistrat_id") REFERENCES "nominations_context"."magistrat"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD CONSTRAINT "dossier_de_nomination_detected_jurisdiction_id_fkey" FOREIGN KEY ("detected_jurisdiction_id") REFERENCES "data_administration_context"."jurisdictions"("codejur") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD CONSTRAINT "dossier_de_nomination_detected_targeted_function_id_fkey" FOREIGN KEY ("detected_targeted_function_id") REFERENCES "data_administration_context"."function"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD CONSTRAINT "dossier_de_nomination_detected_targeted_position_id_fkey" FOREIGN KEY ("detected_targeted_position_id") REFERENCES "data_administration_context"."position"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

UPDATE "nominations_context"."dossier_de_nomination"
  SET sortable_targeted_grade = 29 WHERE targeted_grade = 'G3sup';

UPDATE "nominations_context"."dossier_de_nomination"
  SET sortable_targeted_grade = 30 WHERE targeted_grade = 'G3';

UPDATE "nominations_context"."dossier_de_nomination"
  SET sortable_targeted_grade = 31 WHERE targeted_grade = 'G2';

UPDATE "nominations_context"."dossier_de_nomination"
  SET sortable_targeted_grade = 32 WHERE targeted_grade = 'G1';

UPDATE "nominations_context"."dossier_de_nomination"
  SET sortable_targeted_grade = 10 WHERE targeted_grade = 'HH';

UPDATE "nominations_context"."dossier_de_nomination"
  SET sortable_targeted_grade = 20 WHERE targeted_grade = 'I';

UPDATE "nominations_context"."dossier_de_nomination"
  SET sortable_targeted_grade = 30 WHERE targeted_grade = 'II';

COMMIT;