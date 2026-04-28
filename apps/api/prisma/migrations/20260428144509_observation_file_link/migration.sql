BEGIN;

-- AlterTable
ALTER TABLE "nominations_context"."observation_file"
  ADD COLUMN "original_file_id" UUID,
  ADD COLUMN "original_observation_id" UUID;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_file"
  ADD CONSTRAINT "observation_file_original_observation_id_original_file_id_fkey"
  FOREIGN KEY ("original_observation_id", "original_file_id")
    REFERENCES "nominations_context"."observation_file"("observation_id", "file_id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;
