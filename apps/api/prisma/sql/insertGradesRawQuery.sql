WITH bronze_grade AS (
  SELECT
    g ->> 'grade' AS grade,
    (g ->> 'tri')::SMALLINT AS sort,
    g ->> 'libelle' AS label,
    g ->> 'masse_grade' AS mass_grade_id
  FROM UNNEST ($1::JSONB[]) AS g
),

silver_unknown_mass_grade AS (
  SELECT bronze_grade.grade, bronze_grade.mass_grade_id as "massGrade"
  FROM bronze_grade
    LEFT JOIN bronze_grade AS mg
      ON mg.grade = bronze_grade.mass_grade_id
  WHERE mg.grade IS NULL AND bronze_grade.mass_grade_id IS NOT NULL
),

gold_grade AS (
  INSERT INTO data_administration_context.grade (grade, sort, label, mass_grade_id)
  SELECT grade, sort, label, mass_grade_id FROM bronze_grade

  ON CONFLICT (grade) DO UPDATE set
    sort = EXCLUDED.sort,
    label = EXCLUDED.label,
    mass_grade_id = EXCLUDED.mass_grade_id
)

SELECT *
FROM silver_unknown_mass_grade
