-- @param {String} $1:sessionId
-- @param $2:ids?

SELECT
  ddn.id,
  ddn.number,
  ddn.outcome,
  ddn.outcome_comment AS "outcomeComment",
  m.magistrat,

  JSON_BUILD_OBJECT(
    'grade', p.grade_id,
    'jurisdiction', JSON_BUILD_OBJECT('id', j.codejur, 'label', j.libelle),
    'function', JSON_BUILD_OBJECT(
      'id', f.id,
      'label', f.label,
      'labelOneMale', f.label_one_male,
      'labelOneFemale', f.label_one_female,
      'addition', f.addition
    )
  ) AS "targetPosition"

FROM nominations_context.dossier_de_nomination ddn
  INNER JOIN LATERAL (
    SELECT
      JSON_BUILD_OBJECT(
        'id', mm.external_id,
        'civility', mm.civilite,
        'firstName', mm.first_name,
        'lastName', mm.last_name,
        'marriedName', mm.married_name,
        'usedName', mm.used_name,

        'position', JSON_BUILD_OBJECT(
          'grade', mm.grade,
          'jurisdiction', JSON_BUILD_OBJECT('id', j.codejur, 'label', j.libelle),
          'function', JSON_BUILD_OBJECT(
            'id', f.id,
            'label', f.label,
            'labelOneMale', f.label_one_male,
            'labelOneFemale', f.label_one_female,
            'addition', f.addition
          )
        )
      ) AS magistrat

    FROM nominations_context.magistrat mm
      INNER JOIN data_administration_context."position" p ON p.id = mm.current_position_id::INT
      INNER JOIN data_administration_context."function" f ON f.id = p.function_id
      INNER JOIN data_administration_context."jurisdictions" j ON j.codejur = p.jurisdiction_id

    WHERE mm.id = ddn.detected_magistrat_id
  ) AS m ON TRUE

  INNER JOIN data_administration_context."position" AS p ON p.id = ddn.detected_targeted_position_id
  INNER JOIN data_administration_context."function" AS f ON f.id = p.function_id
  INNER JOIN data_administration_context."jurisdictions" AS j ON j.codejur = p.jurisdiction_id

WHERE (
  ddn.session_id = $1::UUID
  AND ($2::UUID[] IS NULL OR ddn.id = ANY($2::UUID[]))
  AND outcome IS NOT NULL
)

ORDER BY ddn.number;


