import { NominationFile } from "shared-models";

export const summaryLabels = {
  comment: "Rapport",
  biography: "Biographie",
  observers: "Observants",
  rules: {
    [NominationFile.RuleGroup.MANAGEMENT]: "Règles de gestion",
    [NominationFile.RuleGroup.STATUTORY]: "Règles statutaires",
    [NominationFile.RuleGroup.QUALITATIVE]: "Éléments qualitatifs à vérifier",
  },
  attachedFiles: "Pièce(s) jointe(s)",
};

export type SummarySection = { anchorId: string; label: string };
