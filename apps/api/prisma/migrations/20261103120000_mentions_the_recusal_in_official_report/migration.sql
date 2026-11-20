ALTER TYPE "docs"."doc_system_update_cause_enum" ADD VALUE 'RECUSAL';

CREATE TYPE "docs"."official_report_note_status_enum" AS ENUM ('GENERATED', 'EDITED', 'REMOVED');

ALTER TABLE "docs"."official_report_nomination_file"
    ADD COLUMN "recused_members" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "note_status" "docs"."official_report_note_status_enum" NOT NULL DEFAULT 'GENERATED',
    ADD COLUMN "note_outdated" BOOLEAN NOT NULL DEFAULT false;

UPDATE "docs"."official_report_nomination_file" SET "note_status" = 'EDITED' WHERE "note" IS NOT NULL;
