BEGIN;

CREATE SCHEMA "identity_and_access_context";

CREATE TYPE "identity_and_access_context"."role" AS ENUM('MEMBRE_DU_SIEGE', 'MEMBRE_DU_PARQUET', 'MEMBRE_COMMUN');
CREATE TABLE IF NOT EXISTS "identity_and_access_context"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"role" "identity_and_access_context"."role" NOT NULL,
	"email" varchar NOT NULL,
	"password" text NOT NULL
);

COMMIT;