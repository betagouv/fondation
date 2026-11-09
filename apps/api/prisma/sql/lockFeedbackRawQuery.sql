-- @param {String} $1:feedbackId

SELECT f.id
FROM nominations_context.feedback AS f
WHERE f.id = /* feedbackId */$1::UUID
FOR UPDATE
