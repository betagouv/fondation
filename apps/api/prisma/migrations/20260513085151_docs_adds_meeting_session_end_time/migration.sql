BEGIN;

ALTER TABLE docs.agenda_nomination_file ALTER COLUMN outcome DROP NOT NULL;

ALTER TABLE "docs"."justice_presentation_plan" ADD COLUMN "end_time" TIME;

ALTER TABLE "docs"."official_report" ADD COLUMN "session_meeting_ending_time" TIME;

UPDATE "docs"."official_report" SET "session_meeting_ending_time" = "session_meeting_starting_time" + (interval '10 minutes');

ALTER TABLE "docs"."official_report" ALTER COLUMN "session_meeting_ending_time" SET NOT NULL;

COMMIT;
