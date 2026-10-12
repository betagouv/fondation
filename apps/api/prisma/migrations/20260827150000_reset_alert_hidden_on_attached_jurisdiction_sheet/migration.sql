BEGIN;

-- the alert is now derived from the attached jurisdiction sheets: `alert_hidden` only
-- records the explicit "Ignorer cette alerte" gesture
UPDATE "nominations_context"."dossier_de_nomination" AS ddn
SET alert_hidden = FALSE
WHERE ddn.alert_hidden AND EXISTS (
  SELECT 1
  FROM "nominations_context"."nomination_file_attachment" AS nfa
  WHERE nfa.nomination_file_id = ddn.id AND nfa."type" = 'FICHE_DE_JURIDICTION'
);

COMMIT;
