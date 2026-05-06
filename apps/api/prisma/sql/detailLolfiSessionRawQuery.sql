-- @param {Int} $1:sessionId

SELECT
  n.is_designated AS "isDesignated",
  n.rank,

  COALESCE(target_position.formation, m.formation) AS "formation",
  m.id AS "magistratId",
  m.external_id::INT AS "magistratExternalId", 
  m.first_name AS "magistratFirstName", 
  m.last_name AS "magistratLastName", 
  m.married_name AS "magistratMarriedName", 
  m.full_name AS "magistratFullName", 
  m.birth_date AS "magistratBirthDate", 
  m.career_history AS "magistratBiography", 
  m.grade AS "magistratGrade", 
  m.current_position AS "magistratCurrentPosition", 
  m.installation_date AS "lastPositionDate",
  m.grade_date AS "lastRankingDate",

  target_position.detected_targeted_position_id AS "detectedTargetedPositionId",
  target_position.detected_targeted_function_id AS "detectedTargetedFunctionId",
  target_position.detected_jurisdiction_id AS "detectedJurisdictionId",
  target_position.grade AS "targetedGrade",
  target_position.sortable_targeted_grade AS "sortableTargetedGrade",
  target_position.name AS "targetedPosition"

FROM data_administration_context.nomination AS n
  LEFT JOIN LATERAL (
    SELECT
      mm.id,
      mm.first_name,
      mm.last_name,
      mm.married_name,
      CONCAT_WS(' ', UPPER(mm.last_name), CONCAT_WS(' ep. ', UPPER(mm.first_name), UPPER(mm.married_name))) AS full_name,
      mm.birth_date,
      mm.career_history,
      mm.grade,
      mm.external_id,
      mm.grade_date,
      mm.installation_date,
      func.formation,
      CONCAT_WS(' ', LOWER(func.label), jj.codejur) AS current_position

    FROM nominations_context.magistrat mm
      LEFT JOIN data_administration_context."position" pos ON pos.id = mm.current_position_id::INT
      LEFT JOIN data_administration_context."function" func ON func.id = pos.function_id
      LEFT JOIN data_administration_context."jurisdictions" jj ON jj.codejur = pos.jurisdiction_id
    
    WHERE mm.external_id = n.magistrat_id::TEXT
  ) AS m ON TRUE

  LEFT JOIN LATERAL (
    SELECT
      pos.id AS "detected_targeted_position_id",
      func.id AS "detected_targeted_function_id",
      jj.codejur AS "detected_jurisdiction_id",
      grade.sort AS "sortable_targeted_grade",
      func.formation,
      pos.grade_id AS "grade",
      CONCAT_WS(' ', LOWER(func.label), jj.codejur) AS "name"
    FROM data_administration_context."position" pos
      LEFT JOIN data_administration_context.grade ON grade.grade = pos.grade_id
      LEFT JOIN data_administration_context."function" func ON func.id = pos.function_id
      LEFT JOIN data_administration_context."jurisdictions" jj ON jj.codejur = pos.jurisdiction_id
    WHERE pos.id = n.targeted_position_id
  ) AS target_position ON TRUE

WHERE n.session_id = $1::INT
ORDER BY n.position_sort;