BEGIN;

-- the notice copies what the agendas said when it was written and never reads them again, so it
-- carries the answer the agenda and the official report already carry: its text is no longer theirs
ALTER TABLE "docs"."justice_presentation_plan"
    ADD COLUMN "outdated" BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
