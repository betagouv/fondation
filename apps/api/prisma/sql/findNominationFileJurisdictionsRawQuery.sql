-- @param $1:nominationFileIds

SELECT
    d.id,
    current_j.codejur AS "currentJurisdictionId",
    current_j.libelle AS "currentJurisdictionLabel",
    targeted_j.codejur AS "targetedJurisdictionId",
    targeted_j.libelle AS "targetedJurisdictionLabel"
FROM nominations_context.dossier_de_nomination AS d
LEFT JOIN nominations_context.magistrat AS m
    ON m.id = d.detected_magistrat_id
LEFT JOIN data_administration_context."position" AS pos
    ON pos.id = NULLIF(m.current_position_id, '')::INT
LEFT JOIN data_administration_context.jurisdictions AS current_j
    ON current_j.codejur = pos.jurisdiction_id
LEFT JOIN data_administration_context.jurisdictions AS targeted_j
    ON targeted_j.codejur = d.detected_jurisdiction_id
WHERE d.id = ANY($1::UUID[])
