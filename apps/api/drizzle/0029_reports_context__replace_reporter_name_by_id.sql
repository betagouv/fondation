BEGIN;

UPDATE "reports_context"."reports" r
SET "reporter_id" = u.id
FROM "identity_and_access_context"."users" u
WHERE LOWER(CONCAT(u.last_name, ' ', u.first_name)) = LOWER(r.reporter_name);

ALTER TABLE "reports_context"."reports" DROP COLUMN "reporter_name";
ALTER TABLE "reports_context"."reports" ALTER COLUMN "reporter_id" SET NOT NULL;

COMMIT;
