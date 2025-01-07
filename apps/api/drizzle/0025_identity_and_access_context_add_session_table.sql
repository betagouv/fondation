BEGIN;

CREATE TABLE IF NOT EXISTS "identity_and_access_context"."sessions" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"session_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL
);

ALTER TABLE "identity_and_access_context"."sessions" 
	ADD CONSTRAINT "sessions_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") 
	REFERENCES "identity_and_access_context"."users"("id") 
	ON DELETE no action 
	ON UPDATE no action;

COMMIT;