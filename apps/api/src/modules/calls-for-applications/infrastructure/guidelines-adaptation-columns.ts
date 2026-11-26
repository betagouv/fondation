import type { TargetCourtType } from '../domain/call-for-applications';

type Columns = { adaptsCourtOfAppealGuidelines: boolean; adaptsJudicialCourtGuidelines: boolean };

/** the two columns that keep the types of court whose management guidelines a specific call adapts */
export function guidelinesAdaptationsOf(columns: Columns): TargetCourtType[] {
  return [
    ...(columns.adaptsCourtOfAppealGuidelines ? (['COURT_OF_APPEAL'] as const) : []),
    ...(columns.adaptsJudicialCourtGuidelines ? (['JUDICIAL_COURT'] as const) : []),
  ];
}

export function guidelinesAdaptationColumnsOf(adaptations: readonly TargetCourtType[]): Columns {
  return {
    adaptsCourtOfAppealGuidelines: adaptations.includes('COURT_OF_APPEAL'),
    adaptsJudicialCourtGuidelines: adaptations.includes('JUDICIAL_COURT'),
  };
}
