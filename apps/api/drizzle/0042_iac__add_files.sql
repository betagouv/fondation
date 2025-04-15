BEGIN;

CREATE TYPE "identity_and_access_context"."file_type" AS ENUM('PIECE_JOINTE_TRANSPARENCE', 'PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET');
CREATE TABLE "identity_and_access_context"."files" (
	"file_id" uuid PRIMARY KEY NOT NULL,
	"type" "identity_and_access_context"."file_type" NOT NULL
);

COMMIT;