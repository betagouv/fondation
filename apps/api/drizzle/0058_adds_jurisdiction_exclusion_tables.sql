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
