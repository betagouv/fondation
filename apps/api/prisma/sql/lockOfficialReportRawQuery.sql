-- @param {String} $1:officialReportId

SELECT o.id
FROM docs.official_report AS o
WHERE o.id = /* officialReportId */$1::UUID
FOR UPDATE
