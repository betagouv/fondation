-- AlterTable
ALTER TABLE "docs"."official_report_version"
ADD COLUMN "agenda_date" DATE,
ADD COLUMN "agenda_proposition_count" INTEGER,
ADD COLUMN "session_date" DATE;

-- the versions written before take the values of today, the ones their screen reads until now:
-- among the two latest agenda versions, the validated one, or the draft while it never was
-- (as agendaContentOf picks it), and the session date
UPDATE "docs"."official_report_version" AS v
SET
    "agenda_date" = content.date,
    "agenda_proposition_count" = content.proposition_count,
    "session_date" = s.date
FROM "docs"."agenda" AS a
    INNER JOIN "nominations_context"."session" AS s ON a.session_id = s.id
    INNER JOIN LATERAL (
        SELECT
            latest.date,
            (
                SELECT COUNT(*)
                FROM "docs"."agenda_nomination_file" AS anf
                WHERE anf.version_id = latest.id
            ) AS proposition_count
        FROM (
            SELECT
                av.id,
                av.date,
                av.status,
                av.version
            FROM "docs"."agenda_version" AS av
            WHERE av.agenda_id = a.id
            ORDER BY av.version DESC
            LIMIT 2
        ) AS latest
        ORDER BY latest.status = 'VALIDATED' DESC, latest.version DESC
        LIMIT 1
    ) AS content ON TRUE
WHERE a.official_report_id = v.official_report_id;
