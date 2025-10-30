CREATE TYPE "nominations_context"."statut_affectation" AS ENUM('BROUILLON', 'PUBLIEE');--> statement-breakpoint
ALTER TABLE "nominations_context"."affectation" DROP CONSTRAINT "affectation_session_id_unique";--> statement-breakpoint
ALTER TABLE "nominations_context"."affectation" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "nominations_context"."affectation" ADD COLUMN "statut" "nominations_context"."statut_affectation" DEFAULT 'BROUILLON' NOT NULL;--> statement-breakpoint
ALTER TABLE "nominations_context"."affectation" ADD COLUMN "date_publication" timestamp;--> statement-breakpoint
ALTER TABLE "nominations_context"."affectation" ADD COLUMN "auteur_publication" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affectation_session_version" ON "nominations_context"."affectation" USING btree ("session_id","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_one_brouillon_per_session" ON "nominations_context"."affectation" USING btree ("session_id") WHERE "affectation"."statut" = 'BROUILLON';--> statement-breakpoint
ALTER TABLE "nominations_context"."affectation" ADD CONSTRAINT "affectation_session_id_version_unique" UNIQUE("session_id","version");