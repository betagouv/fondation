import { NominationFile } from 'shared-models';

export const stateToLabel = <State extends NominationFile.ReportState>(state: State) => {
  switch (state) {
    case NominationFile.ReportState.NEW:
      return 'Nouveau';
    case NominationFile.ReportState.IN_PROGRESS:
      return 'En cours';
    case NominationFile.ReportState.READY_TO_SUPPORT:
      return 'Prêt à soutenir';
    case NominationFile.ReportState.SUPPORTED:
      return 'Soutenu';
    default: {
      const _exhaustiveCheck: never = state;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled state: ${JSON.stringify(state)}`);
    }
  }
};
