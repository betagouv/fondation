WITH bronze_magistrat AS (
  SELECT
    (m ->> 'date_naiss')::DATE AS birth_date,
    (m ->> 'date_grade')::DATE AS grade_date,
    (m ->> 'date_installation')::DATE AS installation_date,
    (m ->> 'date_nomination')::DATE AS nomination_date,
    (m ->> 'date_posad_prev')::DATE AS admin_position_prev_start,
    (m ->> 'date_posad_prev_fin')::DATE AS admin_position_prev_end,
    (m ->> 'date_posad_prev2')::DATE AS admin_position_prev2_date,
    (m ->> 'date_modification')::DATE AS lolfi_updated_at,
    (m ->> 'tableau')::INT AS advancement_year,
    m ->> 'id' AS external_id,
    m ->> 'civilite' AS civilite,
    m ->> 'nom' AS last_name,
    m ->> 'prenom' AS first_name,
    m ->> 'nom_marital' AS married_name,
    m ->> 'nom_usage' AS used_name,
    m ->> 'sit_fam' AS marital_status,
    m ->> 'email_pro' AS professional_email,
    m ->> 'lieu_naiss' AS birth_place,
    m ->> 'dep_naiss' AS birth_department,
    m ->> 'grade' AS grade,
    m ->> 'num_emploi_cible' AS current_position_id,
    m ->> 'historique' AS career_history,
    m ->> 'posad' AS admin_position,
    m ->> 'posad_prev' AS admin_position_prev,
    m ->> 'posad_prev2' AS admin_position_prev2
  FROM UNNEST($1::JSONB[]) AS m
),

silver_magistrat AS (
  SELECT bm.*
  FROM bronze_magistrat AS bm
    INNER JOIN data_administration_context.grade AS g ON g.grade = bm.grade
    INNER JOIN data_administration_context."position" AS p ON p.id = bm.current_position_id::INT
    INNER JOIN data_administration_context.administrative_position AS ap ON ap.id = bm.admin_position
),

gold_magistrats AS (
  INSERT INTO nominations_context.magistrat (
    birth_date,
    grade_date,
    installation_date,
    nomination_date,
    advancement_year,
    admin_position_prev_start,
    admin_position_prev_end,
    admin_position_prev2_date,
    lolfi_updated_at,
    external_id,
    civilite,
    last_name,
    first_name,
    married_name,
    used_name,
    marital_status,
    professional_email,
    birth_place,
    birth_department,
    grade,
    current_position_id,
    career_history,
    admin_position,
    admin_position_prev,
    admin_position_prev2,
    created_at,
    updated_at
  )
  SELECT
    birth_date,
    grade_date,
    installation_date,
    nomination_date,
    advancement_year,
    admin_position_prev_start,
    admin_position_prev_end,
    admin_position_prev2_date,
    lolfi_updated_at,
    external_id,
    civilite,
    last_name,
    first_name,
    married_name,
    used_name,
    marital_status,
    professional_email,
    birth_place,
    birth_department,
    grade,
    current_position_id,
    career_history,
    admin_position,
    admin_position_prev,
    admin_position_prev2,
    CURRENT_TIMESTAMP AS created_at,
    CURRENT_TIMESTAMP AS updated_at
  FROM silver_magistrat
  ON CONFLICT (external_id) DO UPDATE SET
    -- noqa: disable=CP02
    birth_date = EXCLUDED.birth_date,
    grade_date = EXCLUDED.grade_date,
    installation_date = EXCLUDED.installation_date,
    nomination_date = EXCLUDED.nomination_date,
    advancement_year = EXCLUDED.advancement_year,
    admin_position_prev_start = EXCLUDED.admin_position_prev_start,
    admin_position_prev_end = EXCLUDED.admin_position_prev_end,
    admin_position_prev2_date = EXCLUDED.admin_position_prev2_date,
    lolfi_updated_at = EXCLUDED.lolfi_updated_at,
    civilite = EXCLUDED.civilite,
    last_name = EXCLUDED.last_name,
    first_name = EXCLUDED.first_name,
    married_name = EXCLUDED.married_name,
    used_name = EXCLUDED.used_name,
    marital_status = EXCLUDED.marital_status,
    professional_email = EXCLUDED.professional_email,
    birth_place = EXCLUDED.birth_place,
    birth_department = EXCLUDED.birth_department,
    grade = EXCLUDED.grade,
    current_position_id = EXCLUDED.current_position_id,
    career_history = EXCLUDED.career_history,
    admin_position = EXCLUDED.admin_position,
    admin_position_prev = EXCLUDED.admin_position_prev,
    admin_position_prev2 = EXCLUDED.admin_position_prev2,
    updated_at = CURRENT_TIMESTAMP
)

SELECT
  bm.external_id AS "id",
  err.*
FROM bronze_magistrat AS bm
LEFT JOIN data_administration_context.grade AS g ON g.grade = bm.grade
LEFT JOIN data_administration_context."position" AS p ON p.id = bm.current_position_id::INT
LEFT JOIN data_administration_context.administrative_position AS ap1 ON ap1.id = bm.admin_position
LEFT JOIN data_administration_context.administrative_position AS ap2 ON ap2.id = bm.admin_position_prev
LEFT JOIN data_administration_context.administrative_position AS ap3 ON ap3.id = bm.admin_position_prev2
CROSS JOIN LATERAL (
  SELECT bm.grade, NULL, NULL, NULL, NULL WHERE g.grade IS NULL
  UNION ALL
  SELECT NULL, bm.current_position_id, NULL, NULL, NULL WHERE p.id IS NULL
  UNION ALL
  SELECT NULL, NULL, bm.admin_position, NULL, NULL WHERE ap1.id IS NULL
  UNION ALL
  SELECT NULL, NULL, NULL, bm.admin_position_prev, NULL WHERE ap2.id IS NULL
  UNION ALL
  SELECT NULL, NULL, NULL, NULL, bm.admin_position_prev2 WHERE ap3.id IS NULL
) AS err("unknownGrade", "unknownPositionId", "unknownAdminPosition", "unknownPrevAdminPosition", "unknownPrevAdminPosition2");