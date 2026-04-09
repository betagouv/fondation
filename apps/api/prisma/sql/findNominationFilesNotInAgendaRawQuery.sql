-- @param {String} $2:ignoreAgendaId?

WITH files AS (
  SELECT id::UUID
  FROM UNNEST($1::UUID[]) AS t(id)
)

SELECT files.id
FROM files
  LEFT JOIN docs.agenda_nomination_file AS anf ON anf.nomination_file_id = files.id
WHERE
  anf.agenda_id IS NULL
  OR ($2::UUID IS NOT NULL AND anf.agenda_id = $2::UUID);
