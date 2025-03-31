BEGIN;

ALTER TABLE "reports_context"."report_rule" ALTER COLUMN "rule_name" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "reports_context"."rule_name";--> statement-breakpoint
CREATE TYPE "reports_context"."rule_name" AS ENUM('TRANSFER_TIME', 'GETTING_GRADE_IN_PLACE', 'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT', 'JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION', 'GRADE_ON_SITE_AFTER_7_YEARS', 'MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS', 'MINISTER_CABINET', 'GRADE_REGISTRATION', 'HH_WITHOUT_2_FIRST_GRADE_POSITIONS', 'LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO', 'RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS', 'CONFLICT_OF_INTEREST_PRE_MAGISTRATURE', 'CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION', 'EVALUATIONS', 'DISCIPLINARY_ELEMENTS');--> statement-breakpoint
ALTER TABLE "reports_context"."report_rule" ALTER COLUMN "rule_name" SET DATA TYPE "reports_context"."rule_name" USING "rule_name"::"reports_context"."rule_name";


INSERT INTO reports_context.report_rule (
  rule_group,
  rule_name,
  pre_validated,
  validated,
  report_id
)
SELECT 
  'statutory',
  'RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS',
  false,
  true,
  id
FROM reports_context.reports;

COMMIT;