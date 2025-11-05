CREATE TABLE IF NOT EXISTS "data_administration_context"."excluded_jurisdictions" (
	"user_id" uuid NOT NULL,
	"jurisdiction_id" text NOT NULL,
	CONSTRAINT "excluded_jurisdictions_user_id_jurisdiction_id_pk" PRIMARY KEY("user_id","jurisdiction_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_administration_context"."jurisdictions" (
	"codejur" text PRIMARY KEY NOT NULL,
	"type_jur" text NOT NULL,
	"adr1" text,
	"adr2" text,
	"arrondissement" text,
	"codepos" text,
	"date_suppression" date,
	"libelle" text,
	"ressort" text,
	"ville_jur" text,
	"ville" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nominations_context"."dossier_de_nomination" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"dossier_de_nomination_import_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	CONSTRAINT "dossier_de_nomination_dossier_de_nomination_import_id_unique" UNIQUE("dossier_de_nomination_import_id")
);
--> statement-breakpoint
ALTER TABLE "nominations_context"."affectation" DROP CONSTRAINT "affectation_session_id_version_unique";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_administration_context"."excluded_jurisdictions" ADD CONSTRAINT "excluded_jurisdictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_administration_context"."excluded_jurisdictions" ADD CONSTRAINT "excluded_jurisdictions_jurisdiction_id_jurisdictions_codejur_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "data_administration_context"."jurisdictions"("codejur") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "affectation_session_id_version_index" ON "nominations_context"."affectation" USING btree ("session_id","version");