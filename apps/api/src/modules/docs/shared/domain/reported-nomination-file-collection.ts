import { DocNominationFileOutcomeEnum } from './doc-nomination-file-outcome';

/** A `ReportedNominationFile` is a nomination file that appears in an OfficialReport with a defined outcome other than SUSPENDED */
export class ReportedNominationFileCollection {
  private constructor(
    private readonly map: Map<string, readonly { id: string; outcome: DocNominationFileOutcomeEnum }[]>,
  ) {}

  static from(
    entries: { nominationFileId: string; officialReportId: string; outcome: DocNominationFileOutcomeEnum }[],
  ) {
    const map = entries.reduce((map, x) => {
      const list = map.get(x.nominationFileId) ?? [];
      list.push({ outcome: x.outcome, id: x.officialReportId });
      map.set(x.nominationFileId, list);

      return map;
    }, new Map<string, { id: string; outcome: DocNominationFileOutcomeEnum }[]>());

    return new ReportedNominationFileCollection(map);
  }

  isReported(query: { nominationFileId: string; ignoreOfficialReportId?: string }): boolean {
    const officialReports = this.map.get(query.nominationFileId);
    return Boolean(
      (officialReports ?? []).some(
        ({ id, outcome }) => id !== query.ignoreOfficialReportId && outcome !== 'SUSPENDED',
      ),
    );
  }
}
