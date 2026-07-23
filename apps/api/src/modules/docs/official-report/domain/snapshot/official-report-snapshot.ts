import { DocNominationFileOutcomeEnum } from '../../../shared/domain/doc-nomination-file-outcome';
import { OfficialReportAgenda } from '../official-report-agenda';
import { OfficialReportChairman } from '../official-report-chairman';
import { OfficialReportMembersList } from '../official-report-member-list';
import { OfficialReportSecretary } from '../official-report-secretary';
import { OfficialReportSessionMeeting } from '../official-report-session-meeting';
import {
  InvalidateOfficialReportCommand,
  OfficialReportSnapshotDiff,
  UpdateOfficialReportCommand,
} from '../official-report-types';
import { assertNever } from 'src/utils/assert-never';
import { DateOnly } from 'src/utils/date-only';

import { OfficialReportSnapshotFile } from './official-report-snapshot-file';
import { OfficialReportSnapshotMeta } from './official-report-snapshot-meta';

export class OfficialReportSnapshot {
  private constructor(
    readonly meta: OfficialReportSnapshotMeta,
    private readonly filesSnapshot: OfficialReportSnapshotFilesCollection,
  ) {}

  update(next: UpdateOfficialReportCommand['officialReport']): {
    diff: OfficialReportSnapshotDiff;
    next: OfficialReportSnapshotMeta;
  } {
    return {
      diff: this.diff(next),
      next: OfficialReportSnapshotMeta.from({
        ...next,
        manuallyEditedPart: { conclusion: false, intro: false },
      }),
    };
  }

  invalidate(command: InvalidateOfficialReportCommand): OfficialReportSnapshotDiff {
    switch (command.type) {
      case 'SessionDateUpdated':
        return this.invalidateIntroIf(
          !this.meta.agenda.session.date.equals(DateOnly.fromJson(command.payload.date)),
        );

      case 'AgendaDateUpdated':
        return this.invalidateIntroIf(!this.meta.agenda.date.equals(DateOnly.fromJson(command.payload.date)));

      case 'NominationFilesReportersUpdated':
      case 'NominationFilesOutcomeUpdated':
      case 'AgendaNominationFilesUpdated': {
        const files = this.filesSnapshot.diff(command.payload);
        const hasAny = files.some((file) => file.action !== 'noop');
        return { intro: 'NOOP', conclusion: 'NOOP', hasAny, files };
      }

      default:
        return assertNever(command);
    }
  }

  private invalidateIntroIf(outdated: boolean): OfficialReportSnapshotDiff {
    return {
      hasAny: outdated,
      intro: outdated ? 'OUTDATED' : 'NOOP',
      conclusion: 'NOOP',
      files: [],
    };
  }

  private diff(next: UpdateOfficialReportCommand['officialReport']): OfficialReportSnapshotDiff {
    const metaDiff = this.meta.diff(next);
    const filesDiff = this.filesSnapshot.diff(next);

    return {
      hasAny: metaDiff.hasAny || filesDiff.some(({ action }) => action !== 'noop'),

      intro: metaDiff.intro,
      conclusion: metaDiff.conclusion,
      files: filesDiff,
    };
  }

  static from(props: PlainOfficialReportSnapshot): OfficialReportSnapshot {
    const meta = OfficialReportSnapshotMeta.from(props);
    const files = new OfficialReportSnapshotFilesCollection(props.files);

    return new OfficialReportSnapshot(meta, files);
  }
}

class OfficialReportSnapshotFilesCollection {
  constructor(readonly files: ReadonlyMap<string, OfficialReportSnapshotFile>) {}

  diffFile(next: {
    nominationFileId: string;
    reporters?: readonly string[];
    outcome?: { value: DocNominationFileOutcomeEnum; comment: string | null };
  }): OfficialReportSnapshotDiff['files'][number] {
    const file = this.files.get(next.nominationFileId);
    if (!file) {
      return {
        action: 'create',
        nominationFileId: next.nominationFileId,
      };
    }

    return file.diff(next);
  }

  diff(next: {
    files: readonly {
      nominationFileId: string;
      reporters?: readonly string[];
      outcome?: { value: DocNominationFileOutcomeEnum; comment: string | null };
    }[];
  }): OfficialReportSnapshotDiff['files'] {
    return next.files.flatMap((file) => this.diffFile(file));
  }
}

export type PlainOfficialReportSnapshotManuallyEditedParts = { intro: boolean; conclusion: boolean };
export type PlainOfficialReportSnapshot = {
  hasRenunciation: boolean;
  agenda: OfficialReportAgenda;
  justiceDepartmentContactId: bigint | null;
  sessionMeeting: OfficialReportSessionMeeting;
  chairman: OfficialReportChairman;
  secretary: OfficialReportSecretary;
  members: OfficialReportMembersList;
  manuallyEditedPart: PlainOfficialReportSnapshotManuallyEditedParts;
  files: ReadonlyMap<string, OfficialReportSnapshotFile>;
};
