BEGIN;

-- an official report covers a single agenda, only a notice gathers several of them
CREATE UNIQUE INDEX "agenda_official_report_id_key" ON "docs"."agenda" ("official_report_id");

COMMIT;
