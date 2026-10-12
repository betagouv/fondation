-- @param $1:magistratIds

SELECT
    m.id AS "magistratId",
    CONCAT_WS(' ', func.label, jj.libelle) AS "currentPosition"
FROM nominations_context."magistrat" AS m
LEFT JOIN
    data_administration_context."position" AS pos
    ON pos.id = NULLIF(m.current_position_id, '')::INT
LEFT JOIN
    data_administration_context."function" AS func
    ON func.id = pos.function_id
LEFT JOIN
    data_administration_context."jurisdictions" AS jj
    ON jj.codejur = pos.jurisdiction_id
WHERE m.id = ANY($1::UUID[])
