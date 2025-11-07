WITH affectation_to_session AS (
	SELECT id AS version_id, unnest("affectations_dossiers_de_nominations") AS affectation
	FROM "nominations_context"."affectation"
)
INSERT INTO "nominations_context"."dossier_rapporteur" ("version_id", "user_id", "dossier_id")
SELECT
  version_id,
  (jsonb_array_elements_text(affectation->'rapporteurIds'))::uuid AS "user_id",
  (affectation->>'dossierDeNominationId')::uuid AS "dossier_id"
FROM affectation_to_session
ON CONFLICT DO NOTHING;
--> statement-breakpoint

UPDATE "nominations_context"."dossier_de_nomination"
SET priority = "affectation_to_session".priority
FROM (
  SELECT
    (affectation->>'priorite')::"nominations_context"."priorite_enum" AS priority,
    (affectation->>'dossierDeNominationId')::uuid AS dossier_id
  FROM (
    SELECT id AS version_id, unnest("affectations_dossiers_de_nominations") AS affectation
    FROM "nominations_context"."affectation"
  ) _
  WHERE affectation ? 'priorite'
) AS "affectation_to_session"
WHERE id = "affectation_to_session"."dossier_id";