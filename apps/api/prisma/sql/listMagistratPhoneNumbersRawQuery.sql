-- @param {String} $1:magistratId

-- the numbers saved by the secretariat come first; LOLFI copies the magistrat's number on each candidacy,
-- so each LOLFI number is kept once, dated by its latest candidacy, unless the secretariat saved it
SELECT
  saved.id,
  saved.number,
  saved."label",
  saved.updated_at AS "updatedAt",
  NULL::DATE AS "candidacyDate",
  author.id AS "authorId",
  author.first_name AS "authorFirstName",
  author.last_name AS "authorLastName"
FROM nominations_context.magistrat_phone_number AS saved
  LEFT JOIN identity_and_access_context."users" AS author ON author.id = saved.author_id
WHERE saved.magistrat_id = $1::UUID

UNION ALL

(
  SELECT
    NULL::UUID AS id,
    lolfi.phone AS number,
    NULL::TEXT AS "label",
    NULL::TIMESTAMP AS "updatedAt",
    lolfi.updated_at AS "candidacyDate",
    NULL::UUID AS "authorId",
    NULL::VARCHAR AS "authorFirstName",
    NULL::VARCHAR AS "authorLastName"
  FROM (
    SELECT DISTINCT ON (comparable.phone)
      c.phone,
      c.updated_at,
      comparable.phone AS comparable_phone
    FROM nominations_context.magistrat AS m
      INNER JOIN data_administration_context.candidate AS c ON c.magistrat_id = m.external_id
      -- compared like the saved numbers: only digits and a leading + kept, +33 standing for 0
      CROSS JOIN LATERAL (
        SELECT REGEXP_REPLACE(REGEXP_REPLACE(c.phone, '[^0-9+]', '', 'g'), '^\+330?', '0') AS phone
      ) AS comparable
    WHERE m.id = $1::UUID AND c.phone IS NOT NULL
    ORDER BY comparable.phone ASC, c.updated_at DESC NULLS LAST, c.id DESC
  ) AS lolfi
  WHERE
    NOT EXISTS (
      SELECT 1
      FROM nominations_context.magistrat_phone_number AS saved
      WHERE saved.magistrat_id = $1::UUID AND saved.number = lolfi.comparable_phone
    )
  ORDER BY lolfi.updated_at DESC NULLS LAST
  LIMIT 10
)

ORDER BY "updatedAt" DESC NULLS LAST, "candidacyDate" DESC NULLS LAST
