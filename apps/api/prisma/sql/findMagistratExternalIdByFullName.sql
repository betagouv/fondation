-- @param {String} $1:search

SELECT $1 as input, external_id AS "externalId", first_name, last_name
FROM "nominations_context"."magistrat" AS m
WHERE (
     $1 = LOWER(
       UNACCENT(
         CONCAT_WS(
           ' ep. ',
           CONCAT_WS(' ', m.last_name, m.first_name),
           m.married_name
         )
       )
     )
)
LIMIT 1;