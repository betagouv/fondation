WITH bronze_candidate AS (
  SELECT
    (c ->> 'num_candidat')::INT AS id,
    (c ->> 'id')::INT AS magistrat_id,
    (c ->> 'demande_conjointe')::BOOLEAN AS is_joint,
    (c ->> 'date_modification')::DATE AS updated_at,
    (c ->> 'obs_num_session')::INT AS observation_session_id,
    c ->> 'nom_ville_conjoint' AS spouse,
    c ->> 'observation' AS "comment",
    c ->> 'adr1' AS adr1,
    c ->> 'adr2' AS adr2,
    c ->> 'codepos' AS postal_code,
    c ->> 'ville' AS city,
    c ->> 'tel_perso' AS phone,
    c ->> 'mandat' AS mandate,
    c ->> 'mandat_conjoint' AS spouse_mandate,
    c ->> 'prof_conjoint' AS spouse_occupation,
    c ->> 'article_l111' AS article_l111

  FROM UNNEST($1::JSONB[]) AS c
),

silver_candidate AS (
  SELECT
    bronze_candidate.id,
    bronze_candidate.magistrat_id,
    bronze_candidate.is_joint,
    bronze_candidate.updated_at,
    bronze_candidate.spouse,
    bronze_candidate."comment",
    bronze_candidate.adr1,
    bronze_candidate.adr2,
    bronze_candidate.postal_code,
    bronze_candidate.city,
    bronze_candidate.phone,
    bronze_candidate.mandate,
    bronze_candidate.spouse_mandate,
    bronze_candidate.spouse_occupation,
    bronze_candidate.article_l111,
    s.id AS observation_session_id

  FROM bronze_candidate
    INNER JOIN nominations_context.magistrat AS m ON m.external_id = (bronze_candidate.magistrat_id)::TEXT
    LEFT JOIN data_administration_context."session" AS s ON s.id = bronze_candidate.observation_session_id
),

gold_candidate AS (
  INSERT INTO data_administration_context.candidate (
    id,
    magistrat_id,
    is_joint,
    updated_at,
    spouse,
    "comment",
    adr1,
    adr2,
    postal_code,
    city,
    phone,
    mandate,
    spouse_mandate,
    spouse_occupation,
    article_l111,
    observation_session_id
  )
  SELECT
    id,
    magistrat_id,
    is_joint,
    updated_at,
    spouse,
    "comment",
    adr1,
    adr2,
    postal_code,
    city,
    phone,
    mandate,
    spouse_mandate,
    spouse_occupation,
    article_l111,
    observation_session_id
  FROM silver_candidate
  -- noqa: disable=CP02
  ON CONFLICT (id) DO UPDATE SET
    magistrat_id = EXCLUDED.magistrat_id,
    is_joint = EXCLUDED.is_joint,
    updated_at = EXCLUDED.updated_at,
    spouse = EXCLUDED.spouse,
    "comment" = EXCLUDED."comment",
    adr1 = EXCLUDED.adr1,
    adr2 = EXCLUDED.adr2,
    postal_code = EXCLUDED.postal_code,
    city = EXCLUDED.city,
    phone = EXCLUDED.phone,
    mandate = EXCLUDED.mandate,
    spouse_mandate = EXCLUDED.spouse_mandate,
    spouse_occupation = EXCLUDED.spouse_occupation,
    article_l111 = EXCLUDED.article_l111,
    observation_session_id = EXCLUDED.observation_session_id
    -- noqa: enable=ALL
)

SELECT
  bronze_candidate.id,
  bronze_candidate.magistrat_id AS "unknownMagistratId",
  NULL AS "unknownSessionId"
FROM bronze_candidate
  LEFT JOIN nominations_context.magistrat AS m ON m.external_id = (bronze_candidate.magistrat_id)::TEXT
WHERE m.id IS NULL

UNION

SELECT
  bronze_candidate.id,
  NULL AS "unknownMagistratId",
  bronze_candidate.observation_session_id AS "unknownSessionId"
FROM bronze_candidate
  LEFT JOIN data_administration_context."session" AS s ON s.id = bronze_candidate.observation_session_id
WHERE s.id IS NULL
