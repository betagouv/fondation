-- @param {String} $1:sessionId
-- @param {String} $2:magistratId

SELECT o.id
FROM nominations_context.observation AS o
WHERE
  o.session_id = /* sessionId */$1::UUID
  AND o.magistrat_id = /* magistratId */$2::UUID
ORDER BY o.id
FOR UPDATE
