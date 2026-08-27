import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export type NominationFileOverrides = Partial<Omit<SessionNominationFile, 'content'>> & {
  content?: Partial<SessionNominationFile['content']>;
};

const baseContent: SessionNominationFile['content'] = {
  dateDeNaissance: { year: 1978, month: 4, day: 12 },
  dateEchéance: { year: 2026, month: 9, day: 1 },
  datePassageAuGrade: null,
  datePriseDeFonctionPosteActuel: null,
  detectedMagistratId: null,
  grade: 'I',
  gradeCible: 'HH',
  historique: null,
  informationCarrière: null,
  isAlertHidden: false,
  isUpdatable: true,
  jurisdictions: { current: null, targeted: null },
  nomMagistrat: 'Camille DURAND',
  numeroDeDossier: 42,
  observants: null,
  outcome: null,
  posteActuel: 'Juge au tribunal judiciaire de Lyon',
  posteCible: 'Conseiller à la cour d’appel de Paris',
  rang: null,
  status: { value: 'TO_REPORT', date: null },
  version: 2,
};

export function makeSessionNominationFile(overrides: NominationFileOverrides = {}): SessionNominationFile {
  const { content, ...rest } = overrides;
  return {
    auditionDate: null,
    auditionExpected: false,
    auditionTime: null,
    canScheduleAudition: true,
    comment: null,
    content: { ...baseContent, ...content },
    expectedReportersCount: null,
    hasAttachment: false,
    hasJurisdictionSheet: false,
    id: 'nomination-file',
    isArchived: false,
    memo: null,
    missingEvaluation: false,
    missingEvaluationComment: null,
    observations: [],
    priorities: [],
    reporters: [],
    summary: null,
    ...rest,
  };
}

export function makeSessionNominationFileList(ids: readonly string[]): SessionNominationFile[] {
  return ids.map((id) => makeSessionNominationFile({ id }));
}
