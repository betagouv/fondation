-- @param $1:agendaIds
-- a transaction locks its agendas first, then its official reports: the other order could deadlock

SELECT a.id
FROM docs.agenda AS a
WHERE a.id = ANY(/* agendaIds */$1::UUID[])
ORDER BY a.id
FOR UPDATE
