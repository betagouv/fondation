WITH bronze_nomination AS (
  SELECT
    (t ->> 'num_transparence')::INT AS id,
    (t ->> 'num_session')::INT AS session_id,
    (t ->> 'num_emploi_cible')::INT AS targeted_position_id,
    (t ->> 'type_mouvement')::data_administration_context.nomination_type_enum AS "type",
    (t ->> 'ta')::INT AS last_promotion_year,
    (t ->> 'resultat')::BOOLEAN AS is_designated,
    (t ->> 'affectation')::INT AS current_position_id,
    (t ->> 'date_grade')::DATE AS last_ranking_date,
    (t ->> 'tri_poste')::BIGINT AS position_sort,
    (t ->> 'rang_cand')::INT AS rank,
    t ->> 'id' AS magistrat_id

  FROM UNNEST($1::JSONB[]) AS t
),

silver_nomination AS (
  SELECT bn.*
  FROM bronze_nomination AS bn
    INNER JOIN nominations_context.magistrat AS m ON m.external_id = bn.magistrat_id
    INNER JOIN data_administration_context.session AS s ON s.id = bn.session_id
    INNER JOIN data_administration_context.position AS tp ON tp.id = bn.targeted_position_id
    INNER JOIN data_administration_context.position AS cp ON cp.id = bn.current_position_id
),

gold_nomination AS (
  INSERT INTO data_administration_context.nomination (
    id,
    session_id,
    targeted_position_id,
    "type",
    last_promotion_year,
    is_designated,
    current_position_id,
    last_ranking_date,
    position_sort,
    rank,
    magistrat_id
  )
  SELECT
    id,
    session_id,
    targeted_position_id,
    "type",
    last_promotion_year,
    is_designated,
    current_position_id,
    last_ranking_date,
    position_sort,
    rank,
    magistrat_id
  FROM silver_nomination
  -- noqa: disable=CP02
  ON CONFLICT (id) DO UPDATE SET
    session_id = EXCLUDED.session_id,
    targeted_position_id = EXCLUDED.targeted_position_id,
    "type" = EXCLUDED."type",
    last_promotion_year = EXCLUDED.last_promotion_year,
    is_designated = EXCLUDED.is_designated,
    current_position_id = EXCLUDED.current_position_id,
    last_ranking_date = EXCLUDED.last_ranking_date,
    position_sort = EXCLUDED.position_sort,
    rank = EXCLUDED.rank,
    magistrat_id = EXCLUDED.magistrat_id
    -- noqa: enable=ALL
)

SELECT
  bn.id,
  CASE WHEN m.external_id IS NULL THEN bn.magistrat_id ELSE NULL END AS "unknownMagistratId",
  CASE WHEN s.id IS NULL THEN bn.session_id ELSE NULL END AS "unknownSessionId",
  CASE WHEN tp.id IS NULL THEN bn.targeted_position_id ELSE NULL END AS "unknownTargetPositionId",
  CASE WHEN cp.id IS NULL THEN bn.current_position_id ELSE NULL END AS "unknownCurrentPositionId"
FROM bronze_nomination AS bn
    LEFT JOIN nominations_context.magistrat AS m ON m.external_id = bn.magistrat_id
    LEFT JOIN data_administration_context.session AS s ON s.id = bn.session_id
    LEFT JOIN data_administration_context.position AS tp ON tp.id = bn.targeted_position_id
    LEFT JOIN data_administration_context.position AS cp ON cp.id = bn.current_position_id
WHERE (
  m.external_id IS NULL
  OR s.id IS NULL
  OR tp.id IS NULL
  OR cp.id IS NULL
);
