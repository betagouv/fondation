import { DateOnlyJson } from '../../../../utils/date-only';
import { NominationFileOutcomeEnum } from '../../../shared/nomination-file-outcome.enum';

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
      type: 'AgendaValidated';
      payload: { agendaId: string };
    }
  | {
      /** the agenda's own sentence for a file was rewritten, or given back to the template */
      type: 'AgendaFileBlockEdited';
      payload: { agendaId: string; nominationFileId: string };
    }
  | {
      type: 'NominationFilesOutcomeUpdated';
      payload: {
        files: readonly {
          comment: string | null;
          nominationFileId: string;
          outcome: NominationFileOutcomeEnum | null;
        }[];
      };
    }
  | {
      type: 'SessionAffectationVersionPublished';
      payload: { sessionId: string; versionId: string };
    };

export type SessionDocInvalidation = Extract<
  DocInvalidation,
  { type: 'NominationFilesOutcomeUpdated' | 'SessionAffectationVersionPublished' | 'SessionDateUpdated' }
>;
