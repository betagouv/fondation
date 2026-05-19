import { DocNominationFileOutcomeEnum } from './doc-nomination-file-outcome';

export class ReportedNominationFilesCollection {
  private constructor(
    private readonly reports: Map<
      string,
      { agendaId: string; outcome: DocNominationFileOutcomeEnum | null }[]
    >,
  ) {}

  static from(props: {
    reports: readonly {
      agendaId: string;
      nominationFileId: string;
      outcome: DocNominationFileOutcomeEnum | null;
    }[];
  }) {
    return new ReportedNominationFilesCollection(
      Map.groupBy(props.reports, ({ nominationFileId }) => nominationFileId),
    );
  }

  wasFileReported(query: { fileId: string; ignoreAgendaId?: string }): boolean {
    const previous = this.reports.get(query.fileId);

    return (previous ?? []).some(
      ({ outcome, agendaId }) =>
        (!query.ignoreAgendaId || query.ignoreAgendaId !== agendaId) &&
        outcome !== null &&
        outcome !== 'SUSPENDED',
    );
  }
}
