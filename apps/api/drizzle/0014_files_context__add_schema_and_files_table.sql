BEGIN;

CREATE SCHEMA "files_context";

CREATE TYPE "files_context"."storage_provider" AS ENUM('outscale');

CREATE TABLE IF NOT EXISTS "files_context"."files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar NOT NULL,
	"path" varchar[],
	"storage_provider" "files_context"."storage_provider" NOT NULL
);

COMMIT;