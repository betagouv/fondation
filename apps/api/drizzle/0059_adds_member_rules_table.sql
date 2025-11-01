CREATE TABLE IF NOT EXISTS "data_administration_context"."member_rules" (
	"user_id" uuid NOT NULL,
	"excluded_jurisdiction" text NOT NULL,
	CONSTRAINT "member_rules_user_id_excluded_jurisdiction_pk" PRIMARY KEY("user_id","excluded_jurisdiction")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_administration_context"."member_rules" ADD CONSTRAINT "member_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_administration_context"."member_rules" ADD CONSTRAINT "member_rules_excluded_jurisdiction_jurisdictions_codejur_fk" FOREIGN KEY ("excluded_jurisdiction") REFERENCES "data_administration_context"."jurisdictions"("codejur") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
