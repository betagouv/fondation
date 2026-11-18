-- @param $1:presentExternalIds

SELECT
  COUNT(*)::INT AS active,
  COUNT(*) FILTER (WHERE m.external_id != ALL($1::TEXT[]))::INT AS deactivations
FROM data_administration_context.magistrat AS m
WHERE m.status = 'ACTIVE';
