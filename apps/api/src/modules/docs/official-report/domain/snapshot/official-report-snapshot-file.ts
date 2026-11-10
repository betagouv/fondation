import { isDefined } from '../../../../../utils/is-defined';
import {
  type DocNominationFileOutcomeEnum,
  isFinalDocNominationFileOutcome,
} from '../../../shared/domain/doc-nomination-file-outcome';
import type {
  OfficialReportNamedMember,
  OfficialReportNoteOutdatedBy,
  OfficialReportNoteStatus,
  OfficialReportSnapshotDiff,
} from '../official-report-types';

/** the slot under the proposition: the recusal sentence while nobody wrote there, the reader's text after */
export type OfficialReportSnapshotNote = {
  html: string | null;
  outdatedBy: OfficialReportNoteOutdatedBy | null;
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
  reporters: readonly OfficialReportNamedMember[];
};

export class OfficialReportSnapshotFile {
  private constructor(
    readonly nominationFileId: string | null,
    readonly reporters: readonly OfficialReportNamedMember[],
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
    reporters?: readonly OfficialReportNamedMember[];
  }): OfficialReportSnapshotDiff['files'] {
    return [this.blockDiff(next), this.recusalDiff(next)].filter(({ action }) => action !== 'noop');
  }

  /** the slot already reads this text, so writing it again changes nothing */
  readsNote(html: string): boolean {
    return this.note.status === 'EDITED' && this.note.html === html && this.note.outdatedBy === null;
  }

  /** emptying the slot is only remembered while a recusal would otherwise print its sentence there */
  noteStatusOnRemoval(): Exclude<OfficialReportNoteStatus, 'EDITED'> | null {
    const status = this.recusedMembers.length > 0 ? 'REMOVED' : 'GENERATED';
    const isEmpty = this.note.html === null && this.note.outdatedBy === null;

    return isEmpty && this.note.status === status ? null : status;
  }

  isNoteGenerated(): boolean {
    return this.note.status === 'GENERATED' && this.note.outdatedBy === null;
  }

  private blockDiff(next: {
    nominationFileId: string;
    outcome?: { comment: string | null; value: DocNominationFileOutcomeEnum };
    reporters?: readonly OfficialReportNamedMember[];
  }): OfficialReportSnapshotDiff['files'][number] {
    const reportersChanged = isDefined(next.reporters) && !sameMembers(this.reporters, next.reporters);
    const reportersRenamed =
      isDefined(next.reporters) && !sameList(namesOf(this.reporters), namesOf(next.reporters));
    const outcomeChanged = this.outcomeChanged(next);

    if (!reportersRenamed && !reportersChanged && !outcomeChanged) return { action: 'noop' };

    // a block written by hand keeps the names it gives: only who reports, or the outcome, flags it
    const outdatesBlock = this.hasManuallyEditedHtml && (reportersChanged || outcomeChanged);
    return {
      action: outdatesBlock ? 'outdate' : this.hasManuallyEditedHtml ? 'rename' : 'update',
      nominationFileId: next.nominationFileId,
      outcome: outcomeChanged ? next.outcome?.value : undefined,
      outcomeComment: outcomeChanged ? next.outcome?.comment : undefined,
      reporters: reportersChanged || reportersRenamed ? next.reporters : undefined,
    };
  }

  /**
   * the generated sentence follows the recusal, while a text written or removed by hand is kept and
   * flagged, a removed one only when who is recused changes. A removal outlives the recusal it hid only
   * as long as there is something left to hide.
   */
  private recusalDiff(next: {
    nominationFileId: string;
    recusedMembers?: readonly OfficialReportNamedMember[];
  }): OfficialReportSnapshotDiff['files'][number] {
    if (!next.recusedMembers) return { action: 'noop' };

    const whoChanged = !sameMembers(this.recusedMembers, next.recusedMembers);
    if (!whoChanged && sameList(namesOf(this.recusedMembers), namesOf(next.recusedMembers))) {
      return { action: 'noop' };
    }

    const recuse = {
      action: 'recuse',
      nominationFileId: next.nominationFileId,
      recusedMembers: next.recusedMembers,
    } as const;

    if (this.note.status === 'GENERATED') return { ...recuse, note: 'follow' };
    if (this.note.status === 'REMOVED' && next.recusedMembers.length === 0) {
      return { ...recuse, note: 'generate' };
    }
    // a removed mention prints no name: a renaming only changes the names it would bring back
    if (this.note.status === 'REMOVED' && !whoChanged) return { ...recuse, note: 'follow' };

    // a change of who is recused outranks a renaming, even one flagged before
    const outdatedBy = whoChanged || this.note.outdatedBy === 'RECUSAL' ? 'RECUSAL' : 'DESIGNATION';
    return { ...recuse, note: 'outdate', outdatedBy };
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

/** who is recused, however they are named: a member stored before the ids were kept is known by name */
function sameMembers(
  current: readonly OfficialReportNamedMember[],
  next: readonly OfficialReportNamedMember[],
): boolean {
  return (
    current.length === next.length &&
    current.every((member) =>
      next.some((other) => (member.id === null ? other.name === member.name : other.id === member.id)),
    )
  );
}

function namesOf(members: readonly OfficialReportNamedMember[]): string[] {
  return members.map(({ name }) => name);
}

function sameList(current: readonly string[], next: readonly string[]): boolean {
  return current.length === next.length && current.every((item, i) => next[i] === item);
}
