-- @param {String} $1:sessionId
-- @param $2:versionId
-- @param $3:ids?

SELECT
  ddn.id,
  ddn.number,
  ddn.outcome,
  ddn.outcome_comment AS "outcomeComment",
  m.magistrat,
  reporter.users AS reporters,

  JSON_BUILD_OBJECT(
    'grade', p.grade_id,
    'jurisdiction', JSON_BUILD_OBJECT('id', j.codejur, 'label', j.libelle),
    'function', CASE WHEN f.id IS NOT NULL THEN JSON_BUILD_OBJECT(
      'id', f.id,
      'label', f.label,
      'labelOneMale', f.label_one_male,
      'labelOneFemale', f.label_one_female,
      'addition', f.addition
    ) ELSE NULL END
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
        'externalId', mm.external_id::INT,

        'position', JSON_BUILD_OBJECT(
          'grade', mm.grade,
          'jurisdiction', JSON_BUILD_OBJECT('id', j.codejur, 'label', j.libelle),
          'function', CASE WHEN f.id IS NOT NULL THEN JSON_BUILD_OBJECT(
            'id', f.id,
            'label', f.label,
            'labelOneMale', f.label_one_male,
            'labelOneFemale', f.label_one_female,
            'addition', f.addition
          ) ELSE NULL END
        )
      ) AS magistrat

    FROM nominations_context.magistrat mm
      INNER JOIN data_administration_context."position" p ON p.id = mm.current_position_id::INT
      INNER JOIN data_administration_context."jurisdictions" j ON j.codejur = p.jurisdiction_id
      LEFT JOIN data_administration_context."function" f ON f.id = p.function_id

    WHERE mm.id = ddn.detected_magistrat_id
  ) AS m ON TRUE

  INNER JOIN data_administration_context."position" AS p ON p.id = ddn.detected_targeted_position_id
  INNER JOIN data_administration_context."function" AS f ON f.id = p.function_id
  INNER JOIN data_administration_context."jurisdictions" AS j ON j.codejur = p.jurisdiction_id

  LEFT JOIN LATERAL (
    SELECT
      nfr.nomination_file_id,
      ARRAY_AGG(
        JSON_BUILD_OBJECT(
          'id', u.id,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'gender', u.gender
        )
      ) AS users

    FROM nominations_context.nomination_file_to_reporter AS nfr
      LEFT JOIN identity_and_access_context.users AS u ON u.id = nfr.user_id
    WHERE (nfr.version_id = $2::UUID AND nfr.nomination_file_id = ddn.id)
    GROUP BY nfr.nomination_file_id
  ) AS reporter ON TRUE

WHERE (
  ddn.session_id = $1::UUID
  AND ($3::UUID[] IS NULL OR ddn.id = ANY($3::UUID[]))
  AND outcome IS NOT NULL
)

ORDER BY ddn.number;


