import { DocNominationFileOutcomeEnum } from '../../shared/domain/doc-nomination-file-outcome';
import { OfficialReportInvalidation } from '../../shared/domain/invalidation/official-report-invalidated.integration-event';

import { OfficialReportAgenda } from './official-report-agenda';
import { OfficialReportChairman } from './official-report-chairman';
import { OfficialReportMembersList } from './official-report-member-list';
import { OfficialReportSecretary } from './official-report-secretary';
import { OfficialReportSessionMeeting } from './official-report-session-meeting';

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
      reporters: readonly string[];
      outcome: { value: DocNominationFileOutcomeEnum; comment: string | null };
    }[];
  };
};

export type InvalidateOfficialReportCommand = { id: string } & (
  | Extract<OfficialReportInvalidation, { type: 'SessionDateUpdated' | 'AgendaDateUpdated' }>
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
          reporters: readonly string[];
          outcome: { value: DocNominationFileOutcomeEnum; comment: string | null };
        }[];
      };
    }
  | {
      type: 'NominationFilesReportersUpdated';
      payload: { files: readonly { nominationFileId: string; reporters: readonly string[] }[] };
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
        id: bigint;
        reporters: readonly string[] | undefined;
        outcome: DocNominationFileOutcomeEnum | undefined;
        outcomeComment: string | null | undefined;
      }
    | {
        action: 'create';
        nominationFileId: string;
      }
  )[];
};
