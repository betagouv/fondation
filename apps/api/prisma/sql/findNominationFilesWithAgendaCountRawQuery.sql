-- @param {String} $2:sessionId
WITH files AS (
  SELECT id::UUID
  FROM UNNEST($1::UUID[]) AS t(id)
)

SELECT
  files.id,
  COUNT(anf.*)
FROM files
  INNER JOIN docs.agenda_nomination_file anf ON anf.nomination_file_id = files.id
GROUP BY files.id;
