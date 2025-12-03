BEGIN;

-- AlterTable
ALTER TABLE nominations_context.dossier_de_nomination
ADD COLUMN biography TEXT,
ADD COLUMN birth_date DATE,
ADD COLUMN current_position TEXT,
ADD COLUMN due_date DATE,
ADD COLUMN formation "public".formation,
ADD COLUMN grade TEXT,
ADD COLUMN last_position_date DATE,
ADD COLUMN last_ranking_date DATE,
ADD COLUMN "name" TEXT,
ADD COLUMN number INTEGER,
ADD COLUMN rank TEXT,
ADD COLUMN targeted_position TEXT,
ADD COLUMN observers TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

CREATE FUNCTION DATE_ONLY_TO_SQL_DATE(date_only JSONB) RETURNS DATE AS $$
    BEGIN
        IF date_only = 'null'::JSONB THEN
            RETURN NULL;
        END IF;

        RETURN (
            ARRAY_TO_STRING(
                ARRAY[
                    date_only->>'year',
                    date_only->>'month',
                    date_only->>'day'
                ],
                '-'
            )
        )::DATE;
    END;
$$ LANGUAGE plpgsql;

UPDATE nominations_context.dossier_de_nomination SET
  biography = ("content" ->> 'historique'),
  current_position = ("content" ->> 'posteActuel'),
  observers = ARRAY(SELECT JSONB_ARRAY_ELEMENTS_TEXT("content" -> 'observants')),
  formation = NULL,
  grade = ("content" ->> 'grade'),
  "name" = ("content" ->> 'nomMagistrat'),
  number = ("content" ->> 'numeroDeDossier')::INT,
  rank = ("content" ->> 'rang'),
  targeted_position = ("content" ->> 'posteCible'),
  birth_date = DATE_ONLY_TO_SQL_DATE("content" -> 'dateDeNaissance'),
  due_date = DATE_ONLY_TO_SQL_DATE("content" -> 'dateEchéance'),
  last_position_date = DATE_ONLY_TO_SQL_DATE("content" -> 'datePriseDeFonctionPosteActuel'),
  last_ranking_date = DATE_ONLY_TO_SQL_DATE("content" -> 'datePassageAuGrade')
WHERE "content" ->> 'version' = '2';

UPDATE nominations_context.dossier_de_nomination SET
  biography = ("content" ->> 'biography'),
  current_position = ("content" ->> 'currentPosition'),
  observers = ARRAY(SELECT JSONB_ARRAY_ELEMENTS_TEXT("content" -> 'observers')),
  formation = ("content" ->> 'formation')::"public".formation,
  grade = ("content" ->> 'grade'),
  "name" = ("content" ->> 'name'),
  number = ("content" ->> 'folderNumber')::INT,
  rank = ("content" ->> 'rank'),
  targeted_position = ("content" ->> 'targettedPosition'),
  birth_date = DATE_ONLY_TO_SQL_DATE("content" -> 'birthDate'),
  due_date = DATE_ONLY_TO_SQL_DATE("content" -> 'dueDate'),
  last_position_date = DATE_ONLY_TO_SQL_DATE("content" -> 'datePriseDeFonctionPosteActuel'),
  last_ranking_date = DATE_ONLY_TO_SQL_DATE("content" -> 'datePassageAuGrade')
WHERE (NOT "content" ? 'version') OR "content" ->> 'version' = '1';

ALTER TABLE nominations_context."session"
ADD COLUMN "date" DATE,
ADD COLUMN observations_closing_date DATE,
ADD COLUMN due_date DATE,
ADD COLUMN position_start_date DATE;

UPDATE nominations_context."session" SET
  "date" = ("import".date_transparence)::DATE,
  observations_closing_date = ("import".date_cloture_delai_observation)::date,
  due_date = ("import".date_echeance)::DATE,
  position_start_date = ("import".date_prise_de_poste)::DATE
FROM data_administration_context.transparences AS "import"
WHERE "import".id::TEXT = session_import_id;

UPDATE nominations_context."session" SET
  "date" = DATE_ONLY_TO_SQL_DATE("content" -> 'dateTransparence'),
  observations_closing_date = DATE_ONLY_TO_SQL_DATE("content" -> 'dateClôtureDélaiObservation')
WHERE "date" IS NULL OR observations_closing_date IS NULL;

ALTER TABLE nominations_context."session"
ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN observations_closing_date SET NOT NULL;

DROP FUNCTION IF EXISTS date_only_to_sql_date(date_only JSONB);

COMMIT;
