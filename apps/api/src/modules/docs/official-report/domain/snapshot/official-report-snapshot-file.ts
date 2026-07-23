import {
  type DocNominationFileOutcomeEnum,
  isFinalDocNominationFileOutcomeEnum,
} from '../../../shared/domain/doc-nomination-file-outcome';
import type { OfficialReportSnapshotDiff } from '../official-report-types';

export type PlainOfficialReportSnapshotFile = {
  id: bigint;
  nominationFileId: string | null;
  hasManuallyEditedHtml: boolean;
  reporters: readonly string[];
  outcome: {
    value: DocNominationFileOutcomeEnum;
    comment: string | null;
  };
};

export class OfficialReportSnapshotFile {
  private constructor(
    readonly id: bigint,
    readonly nominationFileId: string | null,
    readonly reporters: readonly string[],
    readonly outcome: { value: DocNominationFileOutcomeEnum; comment: string | null },
    readonly hasManuallyEditedHtml: boolean,
  ) {}

  static from(plain: PlainOfficialReportSnapshotFile): OfficialReportSnapshotFile {
    return new OfficialReportSnapshotFile(
      plain.id,
      plain.nominationFileId,
      plain.reporters,
      plain.outcome,
      plain.hasManuallyEditedHtml,
    );
  }

  diff(next: {
    nominationFileId: string;
    reporters?: readonly string[];
    outcome?: { value: DocNominationFileOutcomeEnum; comment: string | null };
  }): OfficialReportSnapshotDiff['files'][number] {
    const reportersChanged = this.reportersChanged(next);
    const outcomeChanged = this.outcomeChanged(next);

    if (!reportersChanged && !outcomeChanged) return { action: 'noop' };

    return {
      action: this.hasManuallyEditedHtml ? 'outdate' : 'update',
      id: this.id,
      reporters: reportersChanged ? next.reporters : undefined,
      outcome: outcomeChanged ? next.outcome?.value : undefined,
      outcomeComment: outcomeChanged ? next.outcome?.comment : undefined,
    };
  }

  private reportersChanged(next: { reporters?: readonly string[] }): boolean {
    if (!next.reporters) return false;

    return (
      this.reporters.length !== next.reporters.length ||
      this.reporters.some((reporter, i) => next.reporters?.[i] !== reporter)
    );
  }

  private outcomeChanged(next: {
    outcome?: { value: DocNominationFileOutcomeEnum; comment: string | null };
  }): boolean {
    if (!next.outcome) return false;

    if (this.outcome.value === 'SUSPENDED' && isFinalDocNominationFileOutcomeEnum(next.outcome.value)) {
      return false;
    }

    const outcomeChanged =
      this.outcome.value !== next.outcome.value ||
      (this.outcome.comment ?? '').trim() !== (next.outcome.comment ?? '').trim();

    return outcomeChanged;
  }
}
