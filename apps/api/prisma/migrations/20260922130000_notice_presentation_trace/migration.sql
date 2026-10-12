BEGIN;

-- the restitution used to write nothing but the flag, so the notices already presented keep a null trace
ALTER TABLE "docs"."justice_presentation_plan"
    ADD COLUMN "presented_at" TIMESTAMP(3),
    ADD COLUMN "presented_by" UUID,
    ADD CONSTRAINT "justice_presentation_plan_presented_by_fkey" FOREIGN KEY ("presented_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;
