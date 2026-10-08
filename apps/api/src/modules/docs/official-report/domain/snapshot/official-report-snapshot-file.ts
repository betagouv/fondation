import {
  type DocNominationFileOutcomeEnum,
  isFinalDocNominationFileOutcome,
} from '../../../shared/domain/doc-nomination-file-outcome';
import type { OfficialReportSnapshotDiff } from '../official-report-types';

export type PlainOfficialReportSnapshotFile = {
  hasManuallyEditedHtml: boolean;
  nominationFileId: string | null;
  outcome: {
    comment: string | null;
    value: DocNominationFileOutcomeEnum;
  };
  reporters: readonly string[];
};

export class OfficialReportSnapshotFile {
  private constructor(
    readonly nominationFileId: string | null,
    readonly reporters: readonly string[],
    readonly outcome: { comment: string | null; value: DocNominationFileOutcomeEnum },
    readonly hasManuallyEditedHtml: boolean,
  ) {}

  static from(plain: PlainOfficialReportSnapshotFile): OfficialReportSnapshotFile {
    return new OfficialReportSnapshotFile(
      plain.nominationFileId,
      plain.reporters,
      plain.outcome,
      plain.hasManuallyEditedHtml,
    );
  }

  diff(next: {
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

  private reportersChanged(next: { reporters?: readonly string[] }): boolean {
    if (!next.reporters) return false;

    return (
      this.reporters.length !== next.reporters.length ||
      this.reporters.some((reporter, i) => next.reporters?.[i] !== reporter)
    );
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
