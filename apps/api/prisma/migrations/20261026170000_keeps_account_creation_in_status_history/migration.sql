-- The author of an account created before is unknown
INSERT INTO "identity_and_access_context"."user_status_changes" ("user_id", "changed_at", "status", "changed_by")
SELECT "id", "created_at", 'ACTIVE', NULL
FROM "identity_and_access_context"."users"
ON CONFLICT DO NOTHING;
