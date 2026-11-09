CREATE TYPE "docs"."official_report_note_outdated_by_enum" AS ENUM ('RECUSAL', 'DESIGNATION');

ALTER TABLE "docs"."official_report_nomination_file"
    ADD COLUMN "note_outdated_by" "docs"."official_report_note_outdated_by_enum";

-- until now, only a change of who is recused flagged the slot
UPDATE "docs"."official_report_nomination_file" SET "note_outdated_by" = 'RECUSAL' WHERE "note_outdated";

ALTER TABLE "docs"."official_report_nomination_file" DROP COLUMN "note_outdated";
