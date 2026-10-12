-- @param $1:magistratIds

SELECT
  m.id AS "magistratId",
  m.first_name AS "firstName",
  m.last_name AS "lastName",
  m.married_name AS "marriedName",
  m.grade,
  m.professional_email AS email,
  func."label" AS "functionLabel",
  pos.jurisdiction_id AS "jurisdictionId",
  latest_saved."label" AS "phoneLabel",
  -- the latest number saved by the secretariat, else the one of the latest candidacy
  COALESCE(latest_saved.number, latest_candidacy.phone) AS phone
FROM nominations_context.magistrat AS m
  LEFT JOIN
    data_administration_context."position" AS pos
    ON pos.id = NULLIF(m.current_position_id, '')::INT
  LEFT JOIN
    data_administration_context."function" AS func
    ON func.id = pos.function_id
  LEFT JOIN LATERAL (
    SELECT
      saved.number,
      saved."label"
    FROM nominations_context.magistrat_phone_number AS saved
    WHERE saved.magistrat_id = m.id
    ORDER BY saved.updated_at DESC
    LIMIT 1
  ) AS latest_saved ON TRUE
  LEFT JOIN LATERAL (
    SELECT c.phone
    FROM data_administration_context.candidate AS c
    WHERE c.magistrat_id = m.external_id AND c.phone IS NOT NULL
    ORDER BY c.updated_at DESC NULLS LAST, c.id DESC
    LIMIT 1
  ) AS latest_candidacy ON TRUE
WHERE m.id = ANY($1::UUID[])
