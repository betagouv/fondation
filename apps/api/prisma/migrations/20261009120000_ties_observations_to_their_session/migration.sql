BEGIN;

-- an observation knows its session, for the observation module to filter on its own table;
-- the key on (file, session) keeps it the session of its file, the database refusing any other
ALTER TABLE "nominations_context"."observation" ADD COLUMN "session_id" UUID;

UPDATE "nominations_context"."observation" AS o
SET "session_id" = d."session_id"
FROM "nominations_context"."dossier_de_nomination" AS d
WHERE d."id" = o."nomination_file_id";

ALTER TABLE "nominations_context"."observation" ALTER COLUMN "session_id" SET NOT NULL;

CREATE UNIQUE INDEX "dossier_de_nomination_id_session_id_key" ON "nominations_context"."dossier_de_nomination"("id", "session_id");

ALTER TABLE "nominations_context"."observation" DROP CONSTRAINT "observation_nomination_file_id_fkey";
ALTER TABLE "nominations_context"."observation" ADD CONSTRAINT "observation_nomination_file_id_session_id_fkey" FOREIGN KEY ("nomination_file_id", "session_id") REFERENCES "nominations_context"."dossier_de_nomination"("id", "session_id") ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT;
