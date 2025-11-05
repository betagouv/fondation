CREATE TYPE "nominations_context"."priorite_enum" AS ENUM('ETOILE', 'OUTRE_MER', 'PROFILE');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nominations_context"."dossier_rapporteur" (
	"user_id" uuid NOT NULL,
	"dossier_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	CONSTRAINT "dossier_rapporteur_dossier_id_user_id_version_id_pk" PRIMARY KEY("dossier_id","user_id","version_id")
);
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_affectation_session_version";--> statement-breakpoint
ALTER TABLE "nominations_context"."dossier_de_nomination" ADD COLUMN "priority" "nominations_context"."priorite_enum";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nominations_context"."dossier_rapporteur" ADD CONSTRAINT "dossier_rapporteur_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nominations_context"."dossier_rapporteur" ADD CONSTRAINT "dossier_rapporteur_dossier_id_dossier_de_nomination_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nominations_context"."dossier_rapporteur" ADD CONSTRAINT "dossier_rapporteur_version_id_affectation_id_fk" FOREIGN KEY ("version_id") REFERENCES "nominations_context"."affectation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dossier_rapporteur_user_id_index" ON "nominations_context"."dossier_rapporteur" USING btree ("user_id");