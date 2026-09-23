-- @param $1:agendaIds

SELECT a.id
FROM docs.agenda AS a
WHERE a.id = ANY(/* agendaIds */$1::UUID[])
ORDER BY a.id
FOR UPDATE
