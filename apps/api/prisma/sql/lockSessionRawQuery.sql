-- @param {String} $1:sessionId

SELECT s.id
FROM nominations_context.session AS s
WHERE s.id = /* sessionId */$1::UUID
FOR UPDATE
