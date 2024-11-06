BEGIN;

ALTER TABLE "reports_context"."reports" ADD COLUMN "observers" text[];--> statement-breakpoint
ALTER TABLE "shared_kernel_context"."domain_events" DROP COLUMN IF EXISTS "createdAt";

COMMIT;