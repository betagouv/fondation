BEGIN;

INSERT INTO reports_context.report_rule (
  rule_group,
  rule_name,
  pre_validated,
  validated,
  report_id
)
SELECT 
  'statutory',
  'NOMINATION_CA_AVANT_4_ANS',
  false,
  true,
  id
FROM reports_context.reports;

COMMIT;