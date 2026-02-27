WITH bronze_position AS (
  SELECT
    (p -> 'bbis')::BOOLEAN AS bbis,
    (p ->> 'num_emploi_cible')::INT AS id,
    p ->> 'profil' AS "profile",
    p ->> 'abrev_profil' AS profile_id,
    p ->> 'masse_grade' AS grade_id,
    p ->> 'fonction' AS function_id,
    p ->> 'codejur' AS jurisdiction_id,
    p ->> 'type_jur' AS jurisdiction_type_id
  FROM UNNEST($1::JSONB[]) AS p
),

silver_position AS (
  SELECT
    bp.bbis,
    bp.id,
    bp.profile,
    bp.profile_id,
    g.grade AS grade_id,
    f.id AS function_id,
    j.codejur AS jurisdiction_id,
    jt.id AS jurisdiction_type_id
  FROM bronze_position AS bp
    INNER JOIN data_administration_context.jurisdiction_type AS jt
      ON jt.id = bp.jurisdiction_type_id
    INNER JOIN data_administration_context.jurisdictions AS j
      ON j.codejur = bp.jurisdiction_id
    INNER JOIN data_administration_context.grade AS g
      ON g.grade = bp.grade_id
    LEFT JOIN data_administration_context.function AS f
      ON f.id = bp.function_id 
),

gold_position AS (
  INSERT INTO data_administration_context.position (
    id,
    "profile",
    profile_id,
    bbis,
    grade_id,
    function_id,
    jurisdiction_id,
    jurisdiction_type_id
  )
  SELECT
    id,
    "profile",
    profile_id,
    bbis,
    grade_id,
    function_id,
    jurisdiction_id,
    jurisdiction_type_id
  FROM silver_position
  ON CONFLICT (id) DO UPDATE SET
    "profile" = EXCLUDED."profile",
    profile_id = EXCLUDED.profile_id,
    bbis = EXCLUDED.bbis,
    grade_id = EXCLUDED.grade_id,
    function_id = EXCLUDED.function_id,
    jurisdiction_id = EXCLUDED.jurisdiction_id,
    jurisdiction_type_id = EXCLUDED.jurisdiction_type_id
),

unknown_jurisdiction AS (
  SELECT bp.id, bp.jurisdiction_id
  FROM bronze_position AS bp
    LEFT JOIN data_administration_context.jurisdictions AS j
      ON j.codejur = bp.jurisdiction_id
  WHERE j.codejur IS NULL
),

unknown_jurisdiction_type AS (
  SELECT bp.id, bp.jurisdiction_type_id
  FROM bronze_position AS bp
    LEFT JOIN data_administration_context.jurisdiction_type AS jt
      ON jt.id = bp.jurisdiction_type_id
  WHERE jt.id IS NULL
),

unknown_function AS (
  SELECT bp.id, bp.function_id
  FROM bronze_position AS bp
    LEFT JOIN data_administration_context.function AS f
      ON f.id = bp.function_id
  WHERE bp.function_id IS NOT NULL AND f.id IS NULL
),

unknown_grade AS (
  SELECT bp.id, bp.grade_id
  FROM bronze_position AS bp
    LEFT JOIN data_administration_context.grade AS g
      ON g.grade = bp.grade_id
  WHERE g.grade IS NULL
)

SELECT
  COALESCE(unknown_jurisdiction.id, unknown_jurisdiction_type.id, unknown_function.id, unknown_grade.id) AS id,
  unknown_jurisdiction.jurisdiction_id AS "unknownJurisdictionId",
  unknown_jurisdiction_type.jurisdiction_type_id AS "unknownJurisdictionTypeId",
  unknown_function.function_id AS "unknownFunctionId",
  unknown_grade.grade_id AS "unknownGradeId"
FROM unknown_jurisdiction
  LEFT JOIN unknown_jurisdiction_type ON unknown_jurisdiction_type.id = unknown_jurisdiction.id
  LEFT JOIN unknown_function ON unknown_function.id = unknown_jurisdiction.id
  LEFT JOIN unknown_grade ON unknown_grade.id = unknown_jurisdiction.id;

