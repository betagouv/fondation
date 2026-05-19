-- @param $1:fileIds
-- @param {String} $2:ignoreAgendaId?

SELECT
  nomination_file_id AS "nominationFileId",
  agenda_id AS "agendaId",
  outcome
FROM docs.agenda_nomination_file
WHERE (
  nomination_file_id = ANY(/* fileIds */$1::UUID[])
  AND (outcome IS NOT NULL AND outcome != 'SUSPENDED'::docs.agenda_file_outcome_enum)
  AND (/* ignoreAgendaId */$2::UUID IS NULL OR agenda_id != /* ignoreAgendaId */$2::UUID)
)
