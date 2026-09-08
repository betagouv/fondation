-- @param $1:sessionIds

WITH candidature AS (
  SELECT
    n.session_id,
    n.is_designated,
    COALESCE(target_function.formation, current_function.formation) AS formation

  FROM data_administration_context.nomination AS n
    LEFT JOIN data_administration_context."position" AS target_position
      ON target_position.id = n.targeted_position_id
    LEFT JOIN data_administration_context."function" AS target_function
      ON target_function.id = target_position.function_id

    -- the builder falls back on the magistrat's current formation, this must stay aligned with it
    LEFT JOIN nominations_context.magistrat AS m ON m.external_id = n.magistrat_id
    LEFT JOIN data_administration_context."position" AS current_position
      ON current_position.id = m.current_position_id::INT
    LEFT JOIN data_administration_context."function" AS current_function
      ON current_function.id = current_position.function_id

  WHERE n.session_id = ANY(/* sessionIds */$1::INT[])
)

SELECT
  candidature.session_id AS "sessionId",
  COUNT(*)::INT AS candidatures,
  COUNT(*) FILTER (WHERE candidature.is_designated AND candidature.formation = 'SIEGE')::INT AS siege,
  COUNT(*) FILTER (WHERE candidature.is_designated AND candidature.formation = 'PARQUET')::INT AS parquet
FROM candidature
GROUP BY candidature.session_id
