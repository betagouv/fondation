import { DocNominationFileOutcomeEnum } from './doc-nomination-file-outcome';

export class ReportedNominationFilesCollection {
  private constructor(
    private readonly reports: Map<
      string,
      { reportedIn: string; outcome: DocNominationFileOutcomeEnum | null }[]
    >,
  ) {}

  static from(props: {
    reports: readonly {
      reportedIn: string;
      nominationFileId: string;
      outcome: DocNominationFileOutcomeEnum | null;
    }[];
  }) {
    return new ReportedNominationFilesCollection(
      Map.groupBy(props.reports, ({ nominationFileId }) => nominationFileId),
    );
  }

  wasFileReported(query: { fileId: string; ignore?: string }): boolean {
    const previous = this.reports.get(query.fileId);

    return (previous ?? []).some(
      ({ outcome, reportedIn }) =>
        (!query.ignore || query.ignore !== reportedIn) && outcome !== null && outcome !== 'SUSPENDED',
    );
  }
}
