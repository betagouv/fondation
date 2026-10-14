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

  holdsFile(nominationFileId: string): boolean {
    return this.filesSnapshot.files.has(nominationFileId);
  }

  /** a suspension decided since then leaves the files as they are, yet it did happen */
  changedSince(
    command: Exclude<InvalidateOfficialReportCommand, { type: 'AgendaFileBlockEdited' }>,
  ): boolean {
    if (command.type !== 'NominationFilesOutcomeUpdated') return this.invalidate(command).hasAny;

    return command.payload.files.some(({ nominationFileId, outcome }) =>
      this.filesSnapshot.files.get(nominationFileId)?.outcomeDiffers(outcome),
    );
  }

  invalidate(
    command: Exclude<InvalidateOfficialReportCommand, { type: 'AgendaFileBlockEdited' }>,
  ): OfficialReportSnapshotDiff {
    switch (command.type) {
      case 'SessionDateUpdated':
        return this.invalidateIntroIf(
          !command.payload.previousDate ||
            !this.meta.agenda.session.date.equals(DateOnly.fromJson(command.payload.previousDate)),
        );

      case 'AgendaDateUpdated':
        return this.invalidateIntroIf(
          !this.meta.agenda.date.equals(DateOnly.fromJson(command.payload.previousDate)),
        );

      case 'NominationFilesOutcomeUpdated':
        return this.invalidateFiles(command.payload.files.map((file) => this.filesSnapshot.diffFile(file)));

      case 'NominationFilesReportersUpdated':
      case 'AgendaNominationFilesUpdated':
        return this.invalidateFiles(this.filesSnapshot.diff(command.payload));

      default:
        return assertNever(command);
    }
  }

  private invalidateFiles(files: OfficialReportSnapshotDiff['files']): OfficialReportSnapshotDiff {
    return {
      conclusion: 'NOOP',
      files,
      hasAny: files.some((file) => file.action !== 'noop'),
      intro: 'NOOP',
    };
  }

  private invalidateIntroIf(outdated: boolean): OfficialReportSnapshotDiff {
    return {
      conclusion: 'NOOP',
      files: [],
      hasAny: outdated,
      intro: outdated ? 'OUTDATED' : 'NOOP',
    };
  }

  private diff(next: UpdateOfficialReportCommand['officialReport']): OfficialReportSnapshotDiff {
    const metaDiff = this.meta.diff(next);
    const filesDiff = this.filesSnapshot.diff(next);

    return {
      conclusion: metaDiff.conclusion,
      files: filesDiff,
      hasAny: metaDiff.hasAny || filesDiff.some(({ action }) => action !== 'noop'),
      intro: metaDiff.intro,
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
    outcome?: { comment: string | null; value: DocNominationFileOutcomeEnum };
    reporters?: readonly string[];
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

  private deletedFiles(
    files: readonly { nominationFileId: string }[],
  ): OfficialReportSnapshotDiff['files'][number][] {
    const nextFileIds = new Set(files.map(({ nominationFileId }) => nominationFileId));
    const missingFileIds = new Set(this.files.keys()).difference(nextFileIds);

    return Array.from(missingFileIds).map((nominationFileId) => ({ action: 'delete', nominationFileId }));
  }

  diff(next: {
    files: readonly {
      nominationFileId: string;
      outcome?: { comment: string | null; value: DocNominationFileOutcomeEnum };
      reporters?: readonly string[];
    }[];
  }): OfficialReportSnapshotDiff['files'] {
    return this.deletedFiles(next.files).concat(next.files.flatMap((file) => this.diffFile(file)));
  }
}

export type PlainOfficialReportSnapshotManuallyEditedParts = { conclusion: boolean; intro: boolean };
export type PlainOfficialReportSnapshot = {
  agenda: OfficialReportAgenda;
  chairman: OfficialReportChairman;
  files: ReadonlyMap<string, OfficialReportSnapshotFile>;
  hasRenunciation: boolean;
  justiceDepartmentContactId: bigint | null;
  manuallyEditedPart: PlainOfficialReportSnapshotManuallyEditedParts;
  members: OfficialReportMembersList;
  secretary: OfficialReportSecretary;
  sessionMeeting: OfficialReportSessionMeeting;
};
