BEGIN;

-- DropForeignKey
ALTER TABLE "data_administration_context"."transparence_files" DROP CONSTRAINT "transparence_files_file_id_files_id_fk";

-- DropForeignKey
ALTER TABLE "data_administration_context"."transparence_files" DROP CONSTRAINT "transparence_files_transparence_id_transparences_id_fk";

-- DropIndex
DROP INDEX "nominations_context"."idx_affectation_session_version";

-- DropIndex
DROP INDEX "nominations_context"."dossier_de_nomination_dossier_de_nomination_import_id_unique";

-- DropIndex
DROP INDEX IF EXISTS "nominations_context"."dossier_de_nomination_sortable_targeted_grade_idx";

-- DropIndex
DROP INDEX "nominations_context"."observation_nomination_file_id_idx";

-- AlterTable
ALTER TABLE "files_context"."files" ALTER COLUMN "storage_provider" SET DEFAULT 'SCALEWAY';

-- AlterTable
ALTER TABLE "nominations_context"."affectation" DROP COLUMN "affectations_dossiers_de_nominations",
DROP COLUMN "formation";

-- AlterTable
ALTER TABLE "nominations_context"."dossier_de_nomination" DROP COLUMN "content",
DROP COLUMN "dossier_de_nomination_import_id";

-- AlterTable
ALTER TABLE "nominations_context"."session" DROP COLUMN "content";

-- AlterTable
ALTER TABLE "reports_context"."reports" DROP COLUMN "attached_files";

-- DropTable
DROP TABLE "data_administration_context"."nomination_files";

-- DropTable
DROP TABLE "data_administration_context"."transparence_files";

-- DropTable
DROP TABLE "data_administration_context"."transparences";

-- DropTable
DROP TABLE "identity_and_access_context"."files";

-- DropTable
DROP TABLE "nominations_context"."pre_analyse";

-- DropTable
DROP TABLE "shared_kernel_context"."domain_events";

-- DropEnum
DROP TYPE "identity_and_access_context"."file_type";

-- DropEnum
DROP TYPE "transparency";

-- DropEnum
DROP TYPE "shared_kernel_context"."domain_event_status";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "dossier_de_nomination_session_id_sortable_targeted_grade_idx" ON "nominations_context"."dossier_de_nomination"("session_id", "sortable_targeted_grade");

-- RenameForeignKey
ALTER TABLE "nominations_context"."observation_member_comment_screenshot" RENAME CONSTRAINT "observation_member_comment_screenshot_user_id_observation_id_fk" TO "observation_member_comment_screenshot_user_id_observation__fkey";

-- RenameIndex
ALTER INDEX "nominations_context"."affectation_session_id_version_index" RENAME TO "affectation_session_id_version_key";

COMMIT;
