-- the session documents now name a magistrat « Mme Isabelle GAUTHIER (ép. ROBERT) ». A draft written
-- before keeps « Mme GAUTHIER Isabelle (ép. ROBERT) »: its first name and last name swap places. Non-breaking
-- spaces tie the civility, the last name and the first name, and a last name never holds one, so the split
-- is exact. A name written another way, before the non-breaking spaces, is left as it is. A validated
-- agenda or official report is never rewritten: what it prints was sent.
CREATE FUNCTION pg_temp.first_name_first(name TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
    SELECT REGEXP_REPLACE(
        name,
        '^((M\.|Mme)' || U&'\00A0' || ')?([^' || U&'\00A0' || ']+)' || U&'\00A0' || '([^' || U&'\00A0' || '(]+)( \(ép\. [^)]+\))?$',
        '\1\4' || U&'\00A0' || '\3\5'
    )
$$;

-- a renamed draft is rendered again: its cached html and pdf printed the former name. A migration cannot
-- reach the storage, so the pdf objects stay there, unreferenced
CREATE TEMPORARY TABLE stale_pdf (id UUID NOT NULL);

WITH renamed AS (
    UPDATE "docs"."agenda_nomination_file" AS anf
    SET "name" = pg_temp.first_name_first(anf."name")
    FROM "docs"."agenda_version" AS av
    WHERE av.id = anf.version_id AND av.status = 'DRAFT' AND anf."name" <> pg_temp.first_name_first(anf."name")
    RETURNING anf.version_id
),

versions AS (
    SELECT av.id, av.pdf_file_id
    FROM "docs"."agenda_version" AS av
    WHERE av.id IN (SELECT renamed.version_id FROM renamed)
),

cleared AS (
    UPDATE "docs"."agenda_version" AS av
    SET "html" = NULL, "pdf_file_id" = NULL
    FROM versions
    WHERE av.id = versions.id
)

INSERT INTO stale_pdf (id)
SELECT versions.pdf_file_id FROM versions
WHERE versions.pdf_file_id IS NOT NULL;

WITH renamed AS (
    UPDATE "docs"."official_report_nomination_file" AS orf
    SET "name" = pg_temp.first_name_first(orf."name")
    FROM "docs"."official_report_version" AS orv
    WHERE orv.id = orf.version_id AND orv.status = 'DRAFT' AND orf."name" <> pg_temp.first_name_first(orf."name")
    RETURNING orf.version_id
),

versions AS (
    SELECT orv.id, orv.pdf_id
    FROM "docs"."official_report_version" AS orv
    WHERE orv.id IN (SELECT renamed.version_id FROM renamed)
),

cleared AS (
    UPDATE "docs"."official_report_version" AS orv
    SET "html" = NULL, "pdf_id" = NULL
    FROM versions
    WHERE orv.id = versions.id
)

INSERT INTO stale_pdf (id)
SELECT versions.pdf_id FROM versions
WHERE versions.pdf_id IS NOT NULL;

-- a notice has a single version, compared name by name with the agendas: a validated one is renamed too, or it would
-- read as outdated, but keeps its html and pdf. A notice is a draft until its pdf is stored, and its html is the text
-- written by hand once it is manually edited, which the migration keeps
WITH renamed AS (
    UPDATE "docs"."justice_presentation_plan_nomination_file" AS jpf
    SET "name" = pg_temp.first_name_first(jpf."name")
    WHERE jpf."name" <> pg_temp.first_name_first(jpf."name")
    RETURNING jpf.plan_id
)

UPDATE "docs"."justice_presentation_plan" AS jp
SET "html" = NULL
WHERE jp.id IN (SELECT renamed.plan_id FROM renamed) AND jp.pdf_id IS NULL AND NOT jp.is_manually_edited;

DELETE FROM "files_context"."files" AS f
USING stale_pdf
WHERE f.id = stale_pdf.id;

DROP TABLE stale_pdf;
DROP FUNCTION pg_temp.first_name_first(TEXT);
