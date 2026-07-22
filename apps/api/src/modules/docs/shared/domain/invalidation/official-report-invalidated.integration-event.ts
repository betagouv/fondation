import { NominationFileOutcomeEnum } from 'src/modules/session/domain/nomination-file-outcome';
import { DateOnlyJson } from 'src/utils/date-only';

export type OfficialReportInvalidation =
  | {
      type: 'SessionDateUpdated';
      payload: { sessionId: string; date: DateOnlyJson };
    }
  | {
      type: 'AgendaDateUpdated';
      payload: { agendaId: string; date: DateOnlyJson };
    }
  | {
      type: 'AgendaNominationFilesUpdated';
      payload: { agendaId: string };
    }
  | {
      type: 'NominationFileOutcomeUpdated';
      payload: {
        nominationFileId: string;
        outcome: NominationFileOutcomeEnum | null;
        comment: string | null;
      };
    }
  | {
      type: 'SessionAffectationVersionPublished';
      payload: { sessionId: string; versionId: string };
    };

export class OfficialReportsInvalidatedIntegrationEvent {
  static readonly name = Symbol.for('official_reports.invalidated');

  constructor(readonly cause: OfficialReportInvalidation) {}
}
