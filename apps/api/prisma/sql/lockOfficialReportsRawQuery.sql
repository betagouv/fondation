-- @param $1:officialReportIds
-- a transaction locks its agendas first, then its official reports: the other order could deadlock

SELECT o.id
FROM docs.official_report AS o
WHERE o.id = ANY(/* officialReportIds */$1::UUID[])
ORDER BY o.id
FOR UPDATE
