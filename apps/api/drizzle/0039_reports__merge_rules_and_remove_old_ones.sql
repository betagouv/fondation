BEGIN;

ALTER TYPE "public"."rule_group" SET SCHEMA "reports_context";
ALTER TYPE "public"."rule_name" SET SCHEMA "reports_context";
ALTER TABLE "reports_context"."report_rule" DROP COLUMN "comment";

-- Update JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT with merged values
UPDATE "reports_context"."report_rule" AS target
SET 
  "pre_validated" = CASE 
                      WHEN target."pre_validated" = true THEN true
                      WHEN source."pre_validated" = true THEN true
                      ELSE false
                    END,
  "validated" = CASE 
                  WHEN target."validated" = false THEN false
                  WHEN source."validated" = false THEN false 
                  ELSE true
                END
FROM "reports_context"."report_rule" AS source
WHERE 
  target."rule_name" = 'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT'
  AND source."rule_name" = 'JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE'
  AND target."report_id" = source."report_id";

DELETE FROM "reports_context"."report_rule"
WHERE "rule_name" IN (
    'JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE',
    'CASSATION_COURT_NOMINATION',
    'GETTING_FIRST_GRADE',
    'GETTING_GRADE_HH',
    'PROFILED_POSITION',
    'OVERSEAS_TO_OVERSEAS',
    'JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE',
    'HH_NOMINATION_CONDITIONS'
);

COMMIT;