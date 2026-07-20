import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

type NominationFileOverrides = Partial<Omit<SessionNominationFile, 'content'>> & {
  content?: Partial<SessionNominationFile['content']>;
};

const baseContent: SessionNominationFile['content'] = {
  dateDeNaissance: { year: 1978, month: 4, day: 12 },
  dateEchéance: { year: 2026, month: 9, day: 1 },
  datePassageAuGrade: null,
  datePriseDeFonctionPosteActuel: null,
  detectedJurisdictionId: null,
  detectedTargetedFunctionId: null,
  grade: 'I',
  gradeCible: 'HH',
  historique: null,
  informationCarrière: null,
  isAlertHidden: false,
  isUpdatable: true,
  nomMagistrat: 'Camille DURAND',
  numeroDeDossier: 42,
  observants: null,
  outcome: null,
  posteActuel: 'Juge au tribunal judiciaire de Lyon',
  posteCible: 'Conseiller à la cour d’appel de Paris',
  rang: null,
  status: 'TO_REPORT',
  version: 2,
};

export function makeSessionNominationFile(overrides: NominationFileOverrides = {}): SessionNominationFile {
  const { content, ...rest } = overrides;
  return {
    id: 'nomination-file',
    comment: null,
    canScheduleAudition: true,
    auditionDate: null,
    auditionTime: null,
    content: { ...baseContent, ...content },
    hasAttachment: false,
    isArchived: false,
    memo: null,
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
