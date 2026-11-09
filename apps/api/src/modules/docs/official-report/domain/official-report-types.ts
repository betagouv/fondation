import { DocInvalidation } from '../../shared/domain/doc-invalidation';
import { DocNominationFileOutcomeEnum } from '../../shared/domain/doc-nomination-file-outcome';

import { OfficialReportAgenda } from './official-report-agenda';
import { OfficialReportChairman } from './official-report-chairman';
import { OfficialReportMembersList } from './official-report-member-list';
import { OfficialReportSecretary } from './official-report-secretary';
import { OfficialReportSessionMeeting } from './official-report-session-meeting';

export const OFFICIAL_REPORT_NOTE_STATUSES = ['GENERATED', 'EDITED', 'REMOVED'] as const;
export type OfficialReportNoteStatus = (typeof OFFICIAL_REPORT_NOTE_STATUSES)[number];

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
      reporters: readonly string[];
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
          reporters: readonly string[];
          outcome: { value: DocNominationFileOutcomeEnum; comment: string | null };
        }[];
      };
    }
  | {
      type: 'NominationFilesReportersUpdated';
      payload: { files: readonly { nominationFileId: string; reporters: readonly string[] }[] };
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
        action: 'outdate' | 'update';
        nominationFileId: string;
        reporters: readonly string[] | undefined;
        outcome: DocNominationFileOutcomeEnum | undefined;
        outcomeComment: string | null | undefined;
      }
    | {
        /** `follow`: the sentence reads the new recusal, `outdate`: the hand-written slot is flagged,
         * `generate`: a removal with nothing left to hide gives the slot back to the sentence */
        action: 'recuse';
        nominationFileId: string;
        note: 'follow' | 'generate' | 'outdate';
        recusedMembers: readonly OfficialReportNamedMember[];
      }
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
