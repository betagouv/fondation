import { NominationFile } from 'shared-models';

export const summaryLabels = {
  comment: 'Rapport',
  biography: 'Biographie',
  observers: 'Observants',
  rules: {
    [NominationFile.RuleGroup.MANAGEMENT]: 'Lignes directrices de gestion',
    [NominationFile.RuleGroup.STATUTORY]: 'Règles statutaires',
    [NominationFile.RuleGroup.QUALITATIVE]: 'Éléments qualitatifs'
  },
  attachedFiles: 'Pièce(s) jointe(s)'
};

export type SummarySection = { anchorId: string; label: string };
