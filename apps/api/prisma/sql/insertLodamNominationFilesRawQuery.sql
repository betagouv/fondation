-- @param {String} $2:sessionId
-- @param {DateTime} $3:dueDate?
WITH

bronze_lodam_nomination_files AS (
  SELECT
    -- @warning we should provide Date instances to prisma instead of DateOnly
    (lnf ->> 'id')::UUID AS "id",
    (lnf ->> 'birthDate')::DATE AS "birth_date",
    (lnf ->> 'lastPositionDate')::DATE AS "last_position_date",
    (lnf ->> 'lastRankingDate')::DATE AS "last_ranking_date",

    (lnf ->> 'sortableTargetedGrade')::INT AS "sortable_targeted_grade",

    (lnf ->> 'fileNumber')::SMALLINT AS "number",

    lnf ->> 'name' AS "name",
    lnf ->> 'rank' AS "rank",
    lnf ->> 'grade' AS "grade",
    lnf ->> 'targetedGrade' AS "targeted_grade",
    lnf ->> 'targetedPosition' AS "targeted_position",
    lnf ->> 'currentPosition' AS "current_position",
    ARRAY[]::TEXT[] AS "observers",
    lnf ->> 'reporters' AS "reporters",
    lnf ->> 'biography' AS "biography",
    lnf ->> 'careerInformation' AS "career_information"

  FROM UNNEST ($1::JSONB[]) AS lnf
),

silver_nomination_files AS (
  SELECT
    bl."id",
    bl."number",
    bl."rank",

    bl."observers",
    bl."reporters",
    bl."career_information",

    CASE WHEN f.label IS NULL OR j.codejur IS NULL
      THEN bl.targeted_position
      ELSE CONCAT_WS(
        ' ',
        f."label",
        j."codejur"
      )
    END AS "targeted_position",
    COALESCE(pos."grade_id", bl."targeted_grade") AS "targeted_grade",
    COALESCE(gd."sort", bl."sortable_targeted_grade") AS "sortable_targeted_grade",

    COALESCE(m."grade",              bl."grade")              AS "grade",
    COALESCE(m."name",               bl."name")               AS "name",
    COALESCE(m."current_position",   bl."current_position")   AS "current_position",
    COALESCE(m."biography",          bl."biography")          AS "biography",
    COALESCE(m."birth_date",         bl."birth_date")         AS "birth_date",
    COALESCE(m."last_position_date", bl."last_position_date") AS "last_position_date",
    COALESCE(m."last_ranking_date",  bl."last_ranking_date")  AS "last_ranking_date",

    m.id AS "detected_magistrat_id",
    j.codejur AS "detected_jurisdiction_id",
    f.id AS "detected_targeted_function_id",
    pos.id AS "detected_targeted_position_id"

  FROM bronze_lodam_nomination_files AS bl
    LEFT JOIN LATERAL (
      SELECT
        mm.id,
        CONCAT_WS(
          ' ',
          mm.last_name,
          CONCAT_WS(' ep. ', mm.first_name, mm.married_name)
        ) AS "name",
        mm.career_history AS "biography",
        mm.birth_date,
        mm.installation_date AS "last_position_date",
        mm.grade_date AS "last_ranking_date",
        mm.grade,

        CONCAT_WS(
          ' ',
          "function"."label",
          jj."codejur"
        ) AS "current_position"

      FROM nominations_context.magistrat AS mm
        LEFT JOIN data_administration_context.position ON position.id = mm.current_position_id::INT
        LEFT JOIN data_administration_context."function" ON "function".id = position.function_id
        LEFT JOIN data_administration_context.jurisdictions jj ON jj.codejur = position."jurisdiction_id"

      WHERE CONCAT_WS(
        ' ',
        mm.last_name,
        CONCAT_WS(' ep. ', mm.first_name, mm.married_name)
      ) = bl.name

      LIMIT 1
    ) AS m ON TRUE

    LEFT JOIN LATERAL (
      SELECT jj.codejur
      FROM data_administration_context.jurisdictions jj
      WHERE bl.targeted_position ILIKE ('%' || jj.codejur)
      ORDER BY LENGTH(jj.codejur) DESC
      LIMIT 1
    ) AS j ON TRUE

    LEFT JOIN LATERAL (
      SELECT ff.id, ff.label
      FROM data_administration_context.function ff
      WHERE bl.targeted_position ILIKE (ff."label" || '%')
      ORDER BY LENGTH(ff."label") DESC
      LIMIT 1
    ) AS f ON TRUE

    LEFT JOIN data_administration_context.position pos ON pos.jurisdiction_id = j.codejur AND pos.function_id = f.id
    LEFT JOIN data_administration_context.grade gd ON gd.grade = pos.grade_id
)

INSERT INTO nominations_context.dossier_de_nomination (
 "session_id",
 "id",
 "biography",
 "birth_date",
 "current_position",
 "grade",
 "last_position_date",
 "last_ranking_date",
 "name",
 "number",
 "rank",
 "targeted_grade",
 "targeted_position",
 "observers",
 "career_information",
 "sortable_targeted_grade",
 "detected_magistrat_id",
 "detected_jurisdiction_id",
 "detected_targeted_function_id",
 "detected_targeted_position_id",
 "due_date"
)
SELECT DISTINCT ON (snl.number)
  $2::UUID, -- sessionId
  snl."id",
  snl."biography",
  snl."birth_date",
  snl."current_position",
  snl."grade",
  snl."last_position_date",
  snl."last_ranking_date",
  snl."name",
  snl."number",
  snl."rank",
  snl."targeted_grade",
  snl."targeted_position",
  snl."observers",
  snl."career_information",
  snl."sortable_targeted_grade",
  snl."detected_magistrat_id",
  snl."detected_jurisdiction_id",
  snl."detected_targeted_function_id",
  snl."detected_targeted_position_id",
  $3::DATE
FROM silver_nomination_files snl
