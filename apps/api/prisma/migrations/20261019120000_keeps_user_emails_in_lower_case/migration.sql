-- The login matches an email whatever its case: in lower case, the unique index makes an email open one account only
UPDATE "identity_and_access_context"."users" SET "email" = lower("email") WHERE "email" <> lower("email");

ALTER TABLE "identity_and_access_context"."users" ADD CONSTRAINT "users_email_lower_case" CHECK ("email" = lower("email"));
