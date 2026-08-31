import { DocNominationFileOutcomeEnum } from './doc-nomination-file-outcome';

const REPORTED_STATES = ['NONE', 'DRAFT', 'VALIDATED'] as const;

export type ReportedState = (typeof REPORTED_STATES)[number];

type ReportedIn = { id: string; isValidated: boolean; outcome: DocNominationFileOutcomeEnum };

/** A `ReportedNominationFile` is a nomination file that appears in an OfficialReport with a defined outcome other than SUSPENDED */
export class ReportedNominationFileCollection {
  private constructor(private readonly map: Map<string, readonly ReportedIn[]>) {}

  static from(
    entries: {
      nominationFileId: string;
      officialReportId: string;
      isValidated: boolean;
      outcome: DocNominationFileOutcomeEnum;
    }[],
  ) {
    const map = entries.reduce((map, x) => {
      const list = map.get(x.nominationFileId) ?? [];
      list.push({ outcome: x.outcome, id: x.officialReportId, isValidated: x.isValidated });
      map.set(x.nominationFileId, list);

      return map;
    }, new Map<string, ReportedIn[]>());

    return new ReportedNominationFileCollection(map);
  }

  reportedState(query: { nominationFileId: string; ignoreOfficialReportId?: string }): ReportedState {
    const officialReports = (this.map.get(query.nominationFileId) ?? []).filter(
      ({ id, outcome }) => id !== query.ignoreOfficialReportId && outcome !== 'SUSPENDED',
    );

    if (officialReports.length === 0) return 'NONE';
    return officialReports.some(({ isValidated }) => isValidated) ? 'VALIDATED' : 'DRAFT';
  }

  isReported(query: { nominationFileId: string; ignoreOfficialReportId?: string }): boolean {
    return this.reportedState(query) !== 'NONE';
  }
}
