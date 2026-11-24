-- @param {String} $1:userId

SELECT
  m.id,
  m.first_name AS "firstName",
  m.last_name AS "lastName",
  m.married_name AS "marriedName",
  m.grade,
  m.status,

  f.id AS "functionId",
  f.label AS "functionLabel",
  j.codejur AS "jurisdictionId",
  j.libelle AS "jurisdictionLabel"

FROM identity_and_access_context.excluded_magistrats em
  INNER JOIN data_administration_context."magistrat" m ON m.id = em.magistrat_id
  LEFT JOIN data_administration_context."position" p ON p.id = NULLIF(m.current_position_id, '')::INT
  LEFT JOIN data_administration_context."function" f ON f.id = p.function_id
  LEFT JOIN data_administration_context."jurisdictions" j ON j.codejur = p.jurisdiction_id

WHERE em.user_id = $1::UUID

ORDER BY m.last_name ASC, m.first_name ASC, m.id ASC;
