BEGIN;

-- the notices validated before keep a null trace: nobody knows who validated them nor when
ALTER TABLE "docs"."justice_presentation_plan"
    ADD COLUMN "validated_at" TIMESTAMP(3),
    ADD COLUMN "validated_by" UUID,
    ADD CONSTRAINT "justice_presentation_plan_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;
