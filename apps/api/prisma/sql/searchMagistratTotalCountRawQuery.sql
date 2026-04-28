-- @param {String} $1:search?
-- @param $2:ignoreIds?

SELECT COUNT(m.id)
FROM nominations_context."magistrat" m

WHERE (
  1=1
  AND ($1::TEXT IS NULL OR (
    "search" @@ TO_TSQUERY('unaccent_fr'::regconfig, $1::TEXT)
  ))
  AND ($2::UUID[] IS NULL OR (
    "id" != ALL($2::UUID[])
  ))
);
