BEGIN;

ALTER TABLE "nominations_context"."dossier_de_nomination" ADD COLUMN "audition_requested" BOOLEAN;
ALTER TABLE "nominations_context"."nomination_file_audition_version" ADD COLUMN "requested" BOOLEAN;

COMMIT;
