-- @param $1:presentExternalIds

WITH presence AS (
  SELECT
    m.id,
    CASE
      WHEN m.external_id = ANY($1::TEXT[]) THEN 'ACTIVE'
      ELSE 'INACTIVE'
    END::data_administration_context.magistrat_status_enum AS status
  FROM data_administration_context.magistrat AS m
)

UPDATE data_administration_context.magistrat AS m
SET
  status = presence.status,
  updated_at = CURRENT_TIMESTAMP
FROM presence
WHERE presence.id = m.id AND presence.status != m.status;
