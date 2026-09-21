import { NominationFileOutcomeEnum } from 'src/modules/shared/nomination-file-outcome.enum';
import { DateOnlyJson } from 'src/utils/date-only';

export type DocInvalidation =
  | {
      type: 'SessionDateUpdated';
      payload: { sessionId: string; currentDate: DateOnlyJson; previousDate: DateOnlyJson | null };
    }
  | {
      type: 'AgendaDateUpdated';
      payload: { agendaId: string; currentDate: DateOnlyJson; previousDate: DateOnlyJson };
    }
  | {
      type: 'AgendaNominationFilesUpdated';
      payload: { agendaId: string };
    }
  | {
      /** the agenda's own sentence for a file was rewritten, or given back to the template */
      type: 'AgendaFileBlockEdited';
      payload: { agendaId: string; nominationFileId: string };
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

export class DocInvalidatedIntegrationEvent {
  static readonly name = Symbol.for('docs.invalidated');

  constructor(readonly cause: DocInvalidation) {}
}
