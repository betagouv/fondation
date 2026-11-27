-- The adaptation of the management guidelines moves from each type of court to each targeted court.
-- No call adapted them in production yet: the adaptations per type are dropped.
ALTER TABLE "nominations_context"."call_for_applications_target_court" ADD COLUMN "adapts_guidelines" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "nominations_context"."call_for_applications"
DROP COLUMN "adapts_court_of_appeal_guidelines",
DROP COLUMN "adapts_judicial_court_guidelines";

-- The journal keeps one change of the adaptation per update: it reads without its courts
UPDATE "nominations_context"."call_for_applications_changed_field" AS court_of_appeal
SET field_change = 'CHANGED'
FROM "nominations_context"."call_for_applications_changed_field" AS judicial_court
WHERE court_of_appeal.change_id = judicial_court.change_id
  AND court_of_appeal.field = 'COURT_OF_APPEAL_GUIDELINES_ADAPTATION'
  AND judicial_court.field = 'JUDICIAL_COURT_GUIDELINES_ADAPTATION'
  AND court_of_appeal.field_change <> judicial_court.field_change;

DELETE FROM "nominations_context"."call_for_applications_changed_field" AS judicial_court
WHERE judicial_court.field = 'JUDICIAL_COURT_GUIDELINES_ADAPTATION'
  AND EXISTS (
    SELECT 1 FROM "nominations_context"."call_for_applications_changed_field" AS court_of_appeal
    WHERE court_of_appeal.change_id = judicial_court.change_id
      AND court_of_appeal.field = 'COURT_OF_APPEAL_GUIDELINES_ADAPTATION'
  );

ALTER TYPE "nominations_context"."call_for_applications_field_enum" RENAME TO "call_for_applications_field_enum_old";
CREATE TYPE "nominations_context"."call_for_applications_field_enum" AS ENUM (
  'COMMENT', 'DEADLINE', 'GUIDELINES_ADAPTATION', 'PUBLISHED_ON', 'TARGET_COURTS', 'TARGET_POSITIONS', 'TYPE'
);
ALTER TABLE "nominations_context"."call_for_applications_changed_field"
ALTER COLUMN "field" TYPE "nominations_context"."call_for_applications_field_enum"
USING (
  CASE
    WHEN field::TEXT LIKE '%_GUIDELINES_ADAPTATION' THEN 'GUIDELINES_ADAPTATION'
    ELSE field::TEXT
  END
)::"nominations_context"."call_for_applications_field_enum";
DROP TYPE "nominations_context"."call_for_applications_field_enum_old";

-- A court may join the targets and the adaptation in the same change
ALTER TABLE "nominations_context"."call_for_applications_changed_court"
ADD COLUMN "field" "nominations_context"."call_for_applications_field_enum" NOT NULL DEFAULT 'TARGET_COURTS',
DROP CONSTRAINT "call_for_applications_changed_court_pkey",
ADD CONSTRAINT "call_for_applications_changed_court_pkey" PRIMARY KEY ("change_id", "field", "court_id");
