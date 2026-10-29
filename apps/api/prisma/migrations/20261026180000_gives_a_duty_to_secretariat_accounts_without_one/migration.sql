-- An account of the general secretariat registered by the CLI had no duty: shown as an officer, the role filter of the list missed it
UPDATE "identity_and_access_context"."users"
SET "duty" = (CASE WHEN "title" = 'FIRST_SECRETARY' THEN 'SECRETARY' ELSE 'OFFICER' END)::"nominations_context"."user_duty_enum"
WHERE "role" = 'ADJOINT_SECRETAIRE_GENERAL' AND "duty" IS NULL;
