-- PKCE is now required: a request without a challenge can no longer succeed, and it expires within 10 minutes anyway
DELETE FROM "identity_and_access_context"."openid_request" WHERE "challenge" IS NULL;

ALTER TABLE "identity_and_access_context"."openid_request" ALTER COLUMN "challenge" SET NOT NULL;
