BEGIN;

ALTER TABLE "nominations_context"."dossier_de_nomination" ADD COLUMN "audition_requested" BOOLEAN;
ALTER TABLE "nominations_context"."nomination_file_audition_version" ADD COLUMN "requested" BOOLEAN;

-- a scheduled audition was requested: its date only fills in the request
UPDATE "nominations_context"."dossier_de_nomination" SET "audition_requested" = TRUE WHERE "audition_date" IS NOT NULL;
UPDATE "nominations_context"."nomination_file_audition_version" SET "requested" = TRUE WHERE "date" IS NOT NULL;

COMMIT;
