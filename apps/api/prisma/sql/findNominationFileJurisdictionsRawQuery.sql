SELECT
  positions.id,
  current_j.codejur AS "currentJurisdictionId",
  current_j.libelle AS "currentJurisdictionLabel",
  targeted_j.codejur AS "targetedJurisdictionId",
  targeted_j.libelle AS "targetedJurisdictionLabel"
FROM
  UNNEST($1::TEXT [], $2::TEXT [], $3::TEXT []) AS positions (id, current_position, targeted_position)

  LEFT JOIN data_administration_context.jurisdictions AS current_j
    ON positions.current_position ILIKE '%' || current_j.codejur || '%'

  LEFT JOIN data_administration_context.jurisdictions AS targeted_j
    ON positions.targeted_position ILIKE '%' || targeted_j.codejur || '%'
