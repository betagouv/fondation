-- @param {String} $1:email

-- Two rows at most: enough to tell an address held by several magistrats.
-- LOWER on both sides and not ILIKE, where an underscore of the address would stand for any character
SELECT m.id
FROM data_administration_context.magistrat AS m
WHERE m.status = 'ACTIVE' AND LOWER(m.professional_email) = LOWER($1)
LIMIT 2;
