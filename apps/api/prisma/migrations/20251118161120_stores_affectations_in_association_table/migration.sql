BEGIN;

ALTER TABLE "nominations_context"."affectation"
    ALTER COLUMN "formation" SET DEFAULT 'SIEGE',
    ALTER COLUMN "affectations_dossiers_de_nominations" SET DEFAULT ARRAY[]::JSONB[];

-- CreateTable
CREATE TABLE "nominations_context"."nomination_file_to_reporter" (
    "version_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "nomination_file_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nomination_file_to_reporter_pkey" PRIMARY KEY ("version_id","user_id","nomination_file_id")
);

-- explode json data into rows
INSERT INTO "nominations_context"."nomination_file_to_reporter" ("version_id", "user_id", "nomination_file_id", "created_at")
SELECT affectation.version_id, affectation.reporter_id, affectation.nomination_file_id, affectation.created_at
FROM (
    SELECT
        _.id AS version_id,
        (_.affectation->>'dossierDeNominationId')::uuid AS nomination_file_id,
        (jsonb_array_elements_text(_.affectation->'rapporteurIds'))::uuid AS reporter_id,
        _.created_at
    FROM (SELECT "id", "created_at", UNNEST("affectations_dossiers_de_nominations") AS affectation FROM "nominations_context"."affectation") _
) AS affectation
    INNER JOIN identity_and_access_context.users u ON u.id = affectation.reporter_id
    INNER JOIN "nominations_context"."dossier_de_nomination" d ON d.id = affectation.nomination_file_id
ON CONFLICT DO NOTHING;
-- Adds priorite into dossier_de_nomination

-- CreateEnum
CREATE TYPE "nominations_context"."priorite_enum" AS ENUM ('ETOILE', 'OUTRE_MER', 'PROFILE');

-- AlterTable
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD COLUMN     "priorite" "nominations_context"."priorite_enum";

UPDATE "nominations_context"."dossier_de_nomination"
    SET priorite = affectation.priorite
FROM (
    SELECT
        (_.affectation->>'dossierDeNominationId')::uuid AS nomination_file_id,
        (_.affectation->>'priorite')::nominations_context.priorite_enum AS priorite
    FROM (SELECT UNNEST("affectations_dossiers_de_nominations") AS affectation FROM "nominations_context"."affectation") _
) AS affectation
WHERE affectation.nomination_file_id = id AND affectation.priorite IS NOT NULL;

-- CreateIndex
CREATE INDEX "nomination_file_to_reporter_nomination_file_id_idx" ON "nominations_context"."nomination_file_to_reporter"("nomination_file_id");

-- CreateIndex
CREATE INDEX "nomination_file_to_reporter_user_id_idx" ON "nominations_context"."nomination_file_to_reporter"("user_id");

-- AddForeignKey
ALTER TABLE "nominations_context"."affectation" ADD CONSTRAINT "affectation_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."affectation" ADD CONSTRAINT "affectation_auteur_publication_fkey" FOREIGN KEY ("auteur_publication") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."nomination_file_to_reporter" ADD CONSTRAINT "nomination_file_to_reporter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."nomination_file_to_reporter" ADD CONSTRAINT "nomination_file_to_reporter_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."nomination_file_to_reporter" ADD CONSTRAINT "nomination_file_to_reporter_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "nominations_context"."affectation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD CONSTRAINT "dossier_de_nomination_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT;