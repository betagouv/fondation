import { isDefined } from '../../../../../utils/is-defined';
import {
  type DocNominationFileOutcomeEnum,
  isFinalDocNominationFileOutcome,
} from '../../../shared/domain/doc-nomination-file-outcome';
import type {
  OfficialReportNamedMember,
  OfficialReportNoteStatus,
  OfficialReportSnapshotDiff,
} from '../official-report-types';

/** the slot under the proposition: the recusal sentence while nobody wrote there, the reader's text after */
export type OfficialReportSnapshotNote = {
  html: string | null;
  outdated: boolean;
  status: OfficialReportNoteStatus;
};

export type PlainOfficialReportSnapshotFile = {
  hasManuallyEditedHtml: boolean;
  nominationFileId: string | null;
  note: OfficialReportSnapshotNote;
  outcome: {
    comment: string | null;
    value: DocNominationFileOutcomeEnum;
  };
  recusedMembers: readonly OfficialReportNamedMember[];
  reporters: readonly string[];
};

export class OfficialReportSnapshotFile {
  private constructor(
    readonly nominationFileId: string | null,
    readonly reporters: readonly string[],
    readonly outcome: { comment: string | null; value: DocNominationFileOutcomeEnum },
    readonly hasManuallyEditedHtml: boolean,
    readonly note: OfficialReportSnapshotNote,
    readonly recusedMembers: readonly OfficialReportNamedMember[],
  ) {}

  static from(plain: PlainOfficialReportSnapshotFile): OfficialReportSnapshotFile {
    return new OfficialReportSnapshotFile(
      plain.nominationFileId,
      plain.reporters,
      plain.outcome,
      plain.hasManuallyEditedHtml,
      plain.note,
      plain.recusedMembers,
    );
  }

  diff(next: {
    nominationFileId: string;
    outcome?: { comment: string | null; value: DocNominationFileOutcomeEnum };
    recusedMembers?: readonly OfficialReportNamedMember[];
    reporters?: readonly string[];
  }): OfficialReportSnapshotDiff['files'] {
    return [this.blockDiff(next), this.recusalDiff(next)].filter(({ action }) => action !== 'noop');
  }

  /** the slot already reads this text, so writing it again changes nothing */
  readsNote(html: string): boolean {
    return this.note.status === 'EDITED' && this.note.html === html && !this.note.outdated;
  }

  /** emptying the slot is only remembered while a recusal would otherwise print its sentence there */
  noteStatusOnRemoval(): Exclude<OfficialReportNoteStatus, 'EDITED'> | null {
    const status = this.recusedMembers.length > 0 ? 'REMOVED' : 'GENERATED';
    const isEmpty = this.note.html === null && !this.note.outdated;

    return isEmpty && this.note.status === status ? null : status;
  }

  isNoteGenerated(): boolean {
    return this.note.status === 'GENERATED' && !this.note.outdated;
  }

  private blockDiff(next: {
    nominationFileId: string;
    outcome?: { comment: string | null; value: DocNominationFileOutcomeEnum };
    reporters?: readonly string[];
  }): OfficialReportSnapshotDiff['files'][number] {
    const reportersChanged = this.reportersChanged(next);
    const outcomeChanged = this.outcomeChanged(next);

    if (!reportersChanged && !outcomeChanged) return { action: 'noop' };

    return {
      action: this.hasManuallyEditedHtml ? 'outdate' : 'update',
      nominationFileId: next.nominationFileId,
      outcome: outcomeChanged ? next.outcome?.value : undefined,
      outcomeComment: outcomeChanged ? next.outcome?.comment : undefined,
      reporters: reportersChanged ? next.reporters : undefined,
    };
  }

  /**
   * the generated sentence follows the recusal, while a text written or removed by hand is kept and
   * flagged. A removal outlives the recusal it hid only as long as there is something left to hide.
   */
  private recusalDiff(next: {
    nominationFileId: string;
    recusedMembers?: readonly OfficialReportNamedMember[];
  }): OfficialReportSnapshotDiff['files'][number] {
    if (!next.recusedMembers || sameList(namesOf(this.recusedMembers), namesOf(next.recusedMembers))) {
      return { action: 'noop' };
    }

    const note =
      this.note.status === 'GENERATED'
        ? 'follow'
        : this.note.status === 'REMOVED' && next.recusedMembers.length === 0
          ? 'generate'
          : 'outdate';

    return {
      action: 'recuse',
      nominationFileId: next.nominationFileId,
      note,
      recusedMembers: next.recusedMembers,
    };
  }

  private reportersChanged(next: { reporters?: readonly string[] }): boolean {
    return isDefined(next.reporters) && !sameList(this.reporters, next.reporters);
  }

  outcomeDiffers(next: { comment: string | null; value: DocNominationFileOutcomeEnum }): boolean {
    return (
      this.outcome.value !== next.value || (this.outcome.comment ?? '').trim() !== (next.comment ?? '').trim()
    );
  }

  private outcomeChanged(next: {
    outcome?: { comment: string | null; value: DocNominationFileOutcomeEnum };
  }): boolean {
    if (!next.outcome) return false;

    // the meeting suspended the file: its later outcome is reported by another meeting, not this one
    if (this.outcome.value === 'SUSPENDED' && isFinalDocNominationFileOutcome(next.outcome.value)) {
      return false;
    }

    return this.outcomeDiffers(next.outcome);
  }
}

function namesOf(members: readonly OfficialReportNamedMember[]): string[] {
  return members.map(({ name }) => name);
}

function sameList(current: readonly string[], next: readonly string[]): boolean {
  return current.length === next.length && current.every((item, i) => next[i] === item);
}
