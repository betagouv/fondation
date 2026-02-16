-- @param {String} $1:search

SELECT $1 as input, external_id AS "externalId", first_name, last_name
FROM "nominations_context"."magistrat" AS m
WHERE (
     $1 = UNACCENT(LOWER(COALESCE(NULLIF(TRIM(m.married_name), ''), m.last_name) || ' ' || m.first_name))
  OR $1 = UNACCENT(LOWER(m.first_name || ' ' || COALESCE(NULLIF(TRIM(m.married_name), ''), m.last_name)))
)
LIMIT 1;