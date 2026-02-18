WITH bronze_jurisdiction AS (
  SELECT -- noqa: ST06
    j ->> 'codejur' AS codejur,
    j ->> 'type_jur' AS type_jur,
    j ->> 'adr1' AS adr1,
    j ->> 'adr2' AS adr2,
    j ->> 'arrondissement' AS arrondissement,
    j ->> 'codepos' AS codepos,
    (j ->> 'date_suppression')::DATE AS date_suppression,
    j ->> 'libelle' AS libelle,
    j ->> 'ressort' AS ressort,
    j ->> 'ville_jur' AS ville_jur,
    j ->> 'ville' AS ville
  FROM UNNEST($1::JSONB[]) AS j
),

silver_jurisdiction AS (
  SELECT bronze_jurisdiction.*
  FROM bronze_jurisdiction
    INNER JOIN data_administration_context.jurisdiction_type AS jt ON jt.id = bronze_jurisdiction.codejur
),

silver_unknown_jurisdictions AS (
  SELECT bj.codejur, bj.type_jur
  FROM bronze_jurisdiction AS bj
    LEFT JOIN data_administration_context.jurisdiction_type AS jt ON jt.id = bj.codejur
  WHERE jt.id IS NULL
),

gold_jurisdiction AS (
  INSERT INTO data_administration_context.jurisdictions (
    codejur,
    type_jur,
    adr1,
    adr2,
    arrondissement,
    codepos,
    date_suppression,
    libelle,
    ressort,
    ville_jur,
    ville
  )
  SELECT *
  FROM silver_jurisdiction ON CONFLICT (codejur) DO
  UPDATE
    -- noqa: disable=CP02
    SET
      type_jur = EXCLUDED.type_jur,
      adr1 = EXCLUDED.adr1,
      adr2 = EXCLUDED.adr2,
      arrondissement = EXCLUDED.arrondissement,
      codepos = EXCLUDED.codepos,
      date_suppression = EXCLUDED.date_suppression,
      libelle = EXCLUDED.libelle,
      ressort = EXCLUDED.ressort,
      ville_jur = EXCLUDED.ville_jur,
      ville = EXCLUDED.ville
      -- noqa: enable=all
)

SELECT *
FROM silver_unknown_jurisdictions;
