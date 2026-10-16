-- @param $1:presentExternalIds

WITH presence AS (
  SELECT
    m.id,
    CASE
      WHEN m.external_id = ANY($1::TEXT[]) THEN 'ACTIVE'
      ELSE 'INACTIVE'
    END::nominations_context.magistrat_status_enum AS status
  FROM nominations_context.magistrat AS m
)

UPDATE nominations_context.magistrat AS m
SET
  status = presence.status,
  updated_at = CURRENT_TIMESTAMP
FROM presence
WHERE presence.id = m.id AND presence.status != m.status;
