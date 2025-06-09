BEGIN;

ALTER TABLE "data_administration_context"."transparences" ADD COLUMN "date_emission_gds" timestamp;--> statement-breakpoint
ALTER TABLE "data_administration_context"."transparences" ADD COLUMN "date_echeance" timestamp;--> statement-breakpoint
ALTER TABLE "data_administration_context"."transparences" ADD COLUMN "date_prise_de_poste" timestamp;--> statement-breakpoint
ALTER TABLE "data_administration_context"."transparences" ADD COLUMN "date_cloture_delai_observation" timestamp;

COMMIT;