WITH bronze_function AS (
  SELECT
    (f ->> 'lieufc')::formation AS formation,
    (f ->> 'tri')::SMALLINT AS sort,
    f ->> 'fonction' AS id,
    f ->> 'complement' AS addition,
    f ->> 'libelle' AS "label",
    f ->> 'fonction_m' AS label_one_male,
    f ->> 'fonction_mp' AS label_other_male,
    f ->> 'fonction_f' AS label_one_female,
    f ->> 'fonction_fp' AS label_other_female

  FROM UNNEST($1::JSONB[]) AS f
)

INSERT INTO data_administration_context."function" (
  id,
  sort,
  addition,
  formation,
  "label",
  label_one_male,
  label_other_male,
  label_one_female,
  label_other_female
)
SELECT
  id,
  sort,
  addition,
  formation,
  "label",
  label_one_male,
  label_other_male,
  label_one_female,
  label_other_female
FROM bronze_function
ON CONFLICT (id) DO UPDATE SET
  sort = EXCLUDED.sort,
  addition = EXCLUDED.addition,
  formation = EXCLUDED.formation,
  "label" = EXCLUDED."label",
  label_one_male = EXCLUDED.label_one_male,
  label_other_male = EXCLUDED.label_other_male,
  label_one_female = EXCLUDED.label_one_female,
  label_other_female = EXCLUDED.label_other_female;
