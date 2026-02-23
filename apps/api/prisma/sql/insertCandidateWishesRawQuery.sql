WITH bronze_wish AS (
  SELECT
    (w ->> 'num_desiderata')::INT AS id,
    (w ->> 'num_candidat')::INT AS candidate_id,
    (w ->> 'num_emploi_cible')::INT AS position_id,
    (w ->> 'date_enregistrement')::DATE AS created_at
  FROM UNNEST($1::JSONB[]) AS w
),

silver_wish AS (
  SELECT bronze_wish.*
  FROM bronze_wish
    INNER JOIN data_administration_context.candidate AS c ON c.id = bronze_wish.candidate_id
    INNER JOIN data_administration_context.position AS p ON p.id = bronze_wish.position_id
),

gold_wish AS (
  INSERT INTO data_administration_context.candidate_wish (id, candidate_id, position_id, created_at)
  SELECT id, candidate_id, position_id, created_at
  FROM silver_wish
)

SELECT
  bronze_wish.id,
  CASE WHEN c.id IS NULL THEN bronze_wish.candidate_id ELSE NULL END AS "unknownCandidateId",
  CASE WHEN p.id IS NULL THEN bronze_wish.position_id ELSE NULL END AS "unknownPositionId"
FROM bronze_wish
  LEFT JOIN data_administration_context.candidate AS c ON c.id = bronze_wish.candidate_id
  LEFT JOIN data_administration_context.position AS p ON p.id = bronze_wish.position_id
WHERE c.id IS NULL OR p.id IS NULL;

