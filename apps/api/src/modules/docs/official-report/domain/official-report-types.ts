import { DocInvalidation } from '../../shared/domain/doc-invalidation';
import { DocNominationFileOutcomeEnum } from '../../shared/domain/doc-nomination-file-outcome';

import { OfficialReportAgenda } from './official-report-agenda';
import { OfficialReportChairman } from './official-report-chairman';
import { OfficialReportMembersList } from './official-report-member-list';
import { OfficialReportSecretary } from './official-report-secretary';
import { OfficialReportSessionMeeting } from './official-report-session-meeting';

export const OFFICIAL_REPORT_NOTE_STATUSES = ['GENERATED', 'EDITED', 'REMOVED'] as const;
export type OfficialReportNoteStatus = (typeof OFFICIAL_REPORT_NOTE_STATUSES)[number];

export const OFFICIAL_REPORT_NOTE_OUTDATED_BY = ['RECUSAL', 'DESIGNATION'] as const;
/** what changed since the slot was written or emptied by hand: who is recused, or only how one is named */
export type OfficialReportNoteOutdatedBy = (typeof OFFICIAL_REPORT_NOTE_OUTDATED_BY)[number];

/** a member as the report names them: `id` is null on a row written before the ids were kept */
export type OfficialReportNamedMember = { id: string | null; name: string };

export type UpdateOfficialReportCommand = {
  authorId: string;
  officialReport: {
    hasRenunciation: boolean;
    justiceDepartmentContactId: bigint;
    agenda: OfficialReportAgenda;
    sessionMeeting: OfficialReportSessionMeeting;
    chairman: OfficialReportChairman;
    secretary: OfficialReportSecretary;
    members: OfficialReportMembersList;
    files: readonly {
      nominationFileId: string;
      recusedMembers: readonly OfficialReportNamedMember[];
      reporters: readonly OfficialReportNamedMember[];
      outcome: { value: DocNominationFileOutcomeEnum; comment: string | null };
    }[];
  };
};

export type InvalidateOfficialReportCommand = { id: string } & (
  | Extract<DocInvalidation, { type: 'SessionDateUpdated' | 'AgendaDateUpdated' }>
  | {
      type: 'NominationFilesOutcomeUpdated';
      payload: {
        files: readonly {
          nominationFileId: string;
          outcome: { value: DocNominationFileOutcomeEnum; comment: string | null };
        }[];
      };
    }
  | {
      type: 'AgendaNominationFilesUpdated';
      payload: {
        files: readonly {
          nominationFileId: string;
          recusedMembers: readonly OfficialReportNamedMember[];
          reporters: readonly OfficialReportNamedMember[];
          outcome: { value: DocNominationFileOutcomeEnum; comment: string | null };
        }[];
      };
    }
  | {
      type: 'NominationFilesReportersUpdated';
      payload: {
        files: readonly { nominationFileId: string; reporters: readonly OfficialReportNamedMember[] }[];
      };
    }
  | {
      type: 'NominationFilesRecusalsUpdated';
      payload: {
        files: readonly { nominationFileId: string; recusedMembers: readonly OfficialReportNamedMember[] }[];
      };
    }
  | {
      type: 'AgendaFileBlockEdited';
      payload: { nominationFileId: string };
    }
);

type OfficialReportSnapshotDiffStatus = 'OUTDATED' | 'NOOP';
export type OfficialReportSnapshotDiff = {
  hasAny: boolean;
  intro: OfficialReportSnapshotDiffStatus;
  conclusion: OfficialReportSnapshotDiffStatus;
  files: readonly (
    | { action: 'noop' }
    | {
        /** `outdate` flags a block written by hand, `update` settles a generated one, `rename` lets the names a
         * block written by hand will print once given back to the template follow, leaving its flag as it is */
        action: 'outdate' | 'rename' | 'update';
        nominationFileId: string;
        reporters: readonly OfficialReportNamedMember[] | undefined;
        outcome: DocNominationFileOutcomeEnum | undefined;
        outcomeComment: string | null | undefined;
      }
    | ({
        /** `follow`: the sentence reads the new recusal, `outdate`: the hand-written slot is flagged,
         * `generate`: a removal with nothing left to hide gives the slot back to the sentence */
        action: 'recuse';
        nominationFileId: string;
        recusedMembers: readonly OfficialReportNamedMember[];
      } & ({ note: 'follow' | 'generate' } | { note: 'outdate'; outdatedBy: OfficialReportNoteOutdatedBy }))
    | {
        action: 'create';
        nominationFileId: string;
      }
    | {
        action: 'delete';
        nominationFileId: string;
      }
  )[];
};
