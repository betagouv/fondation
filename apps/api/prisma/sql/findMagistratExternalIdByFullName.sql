-- @param {String} $1:search

SELECT external_id AS "externalId"
FROM "nominations_context"."magistrat" AS m
WHERE (
  CASE 
    WHEN m.used_name <> m.last_name
      THEN $1
        LIKE UNACCENT(LOWER('%' || m.last_name || '%' || m.first_name || '%' || m.used_name || '%'))
    ELSE $1 LIKE UNACCENT(LOWER('%' || m.last_name || '%' || m.first_name || '%'))
  END
)
LIMIT 1