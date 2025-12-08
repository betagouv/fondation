BEGIN;

-- AlterTable
ALTER TABLE nominations_context.dossier_de_nomination
ADD COLUMN biography TEXT,
ADD COLUMN birth_date DATE,
ADD COLUMN current_position TEXT,
ADD COLUMN grade TEXT,
ADD COLUMN last_position_date DATE,
ADD COLUMN last_ranking_date DATE,
ADD COLUMN "name" TEXT,
ADD COLUMN number INTEGER,
ADD COLUMN rank TEXT,
ADD COLUMN targeted_position TEXT,
ADD COLUMN observers TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
ADD COLUMN career_information TEXT,
ALTER COLUMN "content" SET DEFAULT '{}'::JSONB;

CREATE OR REPLACE FUNCTION DATE_ONLY_TO_SQL_DATE(date_only JSONB) RETURNS DATE AS $$
    BEGIN
        /* check that date_only contains year, month AND day as top level key */
        IF date_only ?& '{year,month,day}'::TEXT[] THEN
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
        END IF;

        RETURN NULL;
    END;
$$ LANGUAGE plpgsql;

UPDATE nominations_context.dossier_de_nomination SET
  biography = ("content" ->> 'historique'),
  current_position = ("content" ->> 'posteActuel'),
  observers = (
    CASE WHEN jsonb_typeof("content" -> 'observants') = 'array'
      THEN ARRAY(SELECT JSONB_ARRAY_ELEMENTS_TEXT("content" -> 'observants'))
      ELSE '{}'::TEXT[]
    END
  ),
  grade = ("content" ->> 'grade'),
  "name" = ("content" ->> 'nomMagistrat'),
  number = ("content" ->> 'numeroDeDossier')::INT,
  rank = ("content" ->> 'rang'),
  targeted_position = ("content" ->> 'posteCible'),
  birth_date = DATE_ONLY_TO_SQL_DATE("content" -> 'dateDeNaissance'),
  last_position_date = DATE_ONLY_TO_SQL_DATE("content" -> 'datePriseDeFonctionPosteActuel'),
  last_ranking_date = DATE_ONLY_TO_SQL_DATE("content" -> 'datePassageAuGrade'),
  career_information = ("content" ->> 'informationCarrière')
WHERE "content" ->> 'version' = '2';

UPDATE nominations_context.dossier_de_nomination SET
  biography = ("content" ->> 'biography'),
  current_position = ("content" ->> 'currentPosition'),
  observers = (
    CASE WHEN jsonb_typeof("content" -> 'observers') = 'array'
      THEN ARRAY(SELECT JSONB_ARRAY_ELEMENTS_TEXT("content" -> 'observants'))
      ELSE '{}'::TEXT[]
    END
  ),
  grade = ("content" ->> 'grade'),
  "name" = ("content" ->> 'name'),
  number = ("content" ->> 'folderNumber')::INT,
  rank = ("content" ->> 'rank'),
  targeted_position = ("content" ->> 'targettedPosition'),
  birth_date = DATE_ONLY_TO_SQL_DATE("content" -> 'birthDate'),
  last_position_date = DATE_ONLY_TO_SQL_DATE("content" -> 'datePriseDeFonctionPosteActuel'),
  last_ranking_date = DATE_ONLY_TO_SQL_DATE("content" -> 'datePassageAuGrade')
WHERE (
  "content" != '{}'::jsonb
  AND ((NOT "content" ? 'version') OR "content" ->> 'version' = '1')
);

ALTER TABLE nominations_context.dossier_de_nomination
ALTER COLUMN "name" SET NOT NULL;

CREATE UNIQUE INDEX dossier_de_nomination_session_id_number_key
ON nominations_context.dossier_de_nomination (session_id, number);

ALTER TABLE nominations_context."session"
ADD COLUMN "date" DATE,
ADD COLUMN observations_closing_date DATE,
ADD COLUMN due_date DATE,
ADD COLUMN position_start_date DATE;

UPDATE nominations_context."session" SET
  "date" = ("import".date_transparence)::DATE,
  observations_closing_date = ("import".date_cloture_delai_observation)::DATE,
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

-- CreateTable
CREATE TABLE "nominations_context"."session_attachment" (
    "session_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "session_attachment_pkey" PRIMARY KEY ("session_id","file_id")
);

INSERT INTO nominations_context.session_attachment (session_id, file_id)
SELECT s.id::UUID AS session_id, tf.file_id::UUID AS file_id
FROM nominations_context.session s
  INNER JOIN data_administration_context.transparence_files tf ON tf.transparence_id = s.session_import_id::UUID
  INNER JOIN files_context.files f ON f.id = tf.file_id;

-- AddForeignKey
ALTER TABLE "nominations_context"."session_attachment"
ADD CONSTRAINT "session_attachment_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."session_attachment" 
ADD CONSTRAINT "session_attachment_file_id_fkey"
FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") 
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE reports_context.reports
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS reports_session_id_is_deleted_idx 
ON reports_context.reports (session_id, is_deleted);

DROP FUNCTION IF EXISTS date_only_to_sql_date(date_only JSONB);

COMMIT;
