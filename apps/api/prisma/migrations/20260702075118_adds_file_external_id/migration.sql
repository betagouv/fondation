BEGIN;

-- DropIndex
DROP INDEX "nominations_context"."dossier_de_nomination_session_id_number_key";

-- AlterTable
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD COLUMN "external_id" INT;

UPDATE "nominations_context"."dossier_de_nomination"
SET external_id = updater.external_id
FROM (
  SELECT
    ddn.id AS "ddn_id",
    ddn."name",
    dn.id AS external_id
  FROM
    "nominations_context"."session" s
    INNER JOIN "nominations_context"."dossier_de_nomination" ddn ON ddn.session_id = s.id
    INNER JOIN "nominations_context"."magistrat" m ON m.id = ddn.detected_magistrat_id
    INNER JOIN "data_administration_context"."nomination" dn
      ON dn.session_id = s.lolfi_session_id
        AND dn.targeted_position_id = ddn.detected_targeted_position_id
        AND dn.magistrat_id = m.external_id
  WHERE s.lolfi_session_id IS NOT NULL
) AS updater
WHERE updater.ddn_id = dossier_de_nomination.id;

-- CreateIndex
CREATE UNIQUE INDEX "dossier_de_nomination_session_id_external_id_key" ON "nominations_context"."dossier_de_nomination"("session_id", "external_id");

COMMIT;
