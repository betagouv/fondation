import { type DocNominationFileOutcomeEnum } from '../../shared/domain/doc-nomination-file-outcome';
import type { FormationEnum } from 'src/modules/shared/formation.enum';
import { makeId, type Id } from 'src/utils/id';

import {
  InvalidateOfficialReportCommand,
  OfficialReportSnapshotDiff,
  UpdateOfficialReportCommand,
} from './official-report-types';
import { OfficialReportSnapshot, PlainOfficialReportSnapshot } from './snapshot/official-report-snapshot';
import { OfficialReportSnapshotMeta } from './snapshot/official-report-snapshot-meta';

export class OfficialReportCreated {
  constructor(
    readonly id: Id<'OfficialReportId'>,
    readonly authorId: string,
    readonly snapshot: OfficialReportSnapshot,
  ) {}
}

export class OfficialReportUpdated {
  constructor(
    readonly id: Id<'OfficialReportId'>,
    readonly authorId: string,
    readonly snapshot: OfficialReportSnapshotMeta,
    readonly diff: OfficialReportSnapshotDiff,
  ) {}
}

export class OfficialReportDeleted {
  constructor(readonly officialReportId: Id<'OfficialReportId'>) {}
}

export class OfficialReportDocumentReset {
  constructor(readonly officialReportId: Id<'OfficialReportId'>) {}
}

export class OfficialReportIntroEdited {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly html: string,
    readonly outdated: boolean,
  ) {}
}

export class OfficialReportIntroReset {
  constructor(readonly officialReportId: Id<'OfficialReportId'>) {}
}

export class OfficialReportConclusionEdited {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly html: string,
    readonly outdated: boolean,
  ) {}
}

export class OfficialReportConclusionReset {
  constructor(readonly officialReportId: Id<'OfficialReportId'>) {}
}

export class OfficialReportFileEdited {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly nominationFileId: string,
    readonly html: string,
    readonly outdated: boolean,
  ) {}
}

export class OfficialReportFileReset {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly nominationFileId: string,
  ) {}
}

export class OfficialReportSectionTitleEdited {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly outcome: DocNominationFileOutcomeEnum,
    readonly text: string,
  ) {}
}

export class OfficialReportSectionTitleReset {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly outcome: DocNominationFileOutcomeEnum,
  ) {}
}

export class OfficialReportSectionIntroEdited {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly outcome: DocNominationFileOutcomeEnum,
    readonly html: string,
  ) {}
}

export class OfficialReportSectionIntroReset {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly outcome: DocNominationFileOutcomeEnum,
  ) {}
}

export class OfficialReportValidated {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly validatedAt: Date,
  ) {}
}

export class OfficialReportInvalidated {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly diff: OfficialReportSnapshotDiff,
  ) {}
}

export type OfficialReportEvent =
  | OfficialReportCreated
  | OfficialReportUpdated
  | OfficialReportDeleted
  | OfficialReportDocumentReset
  | OfficialReportIntroEdited
  | OfficialReportIntroReset
  | OfficialReportConclusionEdited
  | OfficialReportConclusionReset
  | OfficialReportFileEdited
  | OfficialReportFileReset
  | OfficialReportSectionTitleEdited
  | OfficialReportSectionTitleReset
  | OfficialReportSectionIntroEdited
  | OfficialReportSectionIntroReset
  | OfficialReportValidated
  | OfficialReportInvalidated;

export class OfficialReportDocumentNotStored extends Error {}

type OfficialReportState = { isDocumentStored: boolean; validatedAt: Date | null };

export class OfficialReport {
  readonly #messages: OfficialReportEvent[] = [];
  get messages(): readonly OfficialReportEvent[] {
    return this.#messages;
  }

  get formation(): FormationEnum {
    return this.snapshot.meta.agenda.formation;
  }

  private constructor(
    readonly id: Id<'OfficialReportId'>,
    readonly snapshot: OfficialReportSnapshot,
    private readonly state: OfficialReportState,
  ) {}

  static from(props: { id: Id<'OfficialReportId'>; snapshot: OfficialReportSnapshot } & OfficialReportState) {
    return new OfficialReport(props.id, props.snapshot, {
      isDocumentStored: props.isDocumentStored,
      validatedAt: props.validatedAt,
    });
  }

  static create(command: {
    authorId: string;
    snapshot: Omit<PlainOfficialReportSnapshot, 'files' | 'manuallyEditedPart'>;
  }): OfficialReport {
    const report = new OfficialReport(
      makeId('OfficialReportId'),
      OfficialReportSnapshot.from({
        ...command.snapshot,
        files: new Map(),
        manuallyEditedPart: { intro: false, conclusion: false },
      }),
      { isDocumentStored: false, validatedAt: null },
    );

    report.#messages.push(new OfficialReportCreated(report.id, command.authorId, report.snapshot));

    return report;
  }

  validate(command: { at: Date }): void {
    if (this.state.validatedAt) return;
    if (!this.state.isDocumentStored) throw new OfficialReportDocumentNotStored();

    this.#messages.push(new OfficialReportValidated(this.id, command.at));
  }

  invalidate(command: InvalidateOfficialReportCommand): void {
    const diff = this.snapshot.invalidate(command);
    if (!diff.hasAny) return;
    this.#messages.push(new OfficialReportInvalidated(this.id, diff));
  }

  update(command: UpdateOfficialReportCommand): void {
    const { next, diff } = this.snapshot.update(command.officialReport);
    if (diff.hasAny) this.#messages.push(new OfficialReportInvalidated(this.id, diff));
    this.#messages.push(new OfficialReportUpdated(this.id, command.authorId, next, diff));
  }

  delete(): void {
    this.#messages.push(new OfficialReportDeleted(this.id));
  }

  resetDocument(): void {
    this.#messages.push(new OfficialReportDocumentReset(this.id));
  }

  editIntro(command: { html: string; outdated: boolean }): void {
    this.#messages.push(new OfficialReportIntroEdited(this.id, command.html, command.outdated));
  }

  resetIntro(): void {
    this.#messages.push(new OfficialReportIntroReset(this.id));
  }

  editConclusion(command: { html: string; outdated: boolean }): void {
    this.#messages.push(new OfficialReportConclusionEdited(this.id, command.html, command.outdated));
  }

  resetConclusion(): void {
    this.#messages.push(new OfficialReportConclusionReset(this.id));
  }

  editFile(command: { nominationFileId: string; html: string; outdated: boolean }): void {
    this.#messages.push(
      new OfficialReportFileEdited(this.id, command.nominationFileId, command.html, command.outdated),
    );
  }

  resetFile(command: { nominationFileId: string }): void {
    this.#messages.push(new OfficialReportFileReset(this.id, command.nominationFileId));
  }

  editSectionTitle(command: { outcome: DocNominationFileOutcomeEnum; text: string }): void {
    this.#messages.push(new OfficialReportSectionTitleEdited(this.id, command.outcome, command.text));
  }

  resetSectionTitle(command: { outcome: DocNominationFileOutcomeEnum }): void {
    this.#messages.push(new OfficialReportSectionTitleReset(this.id, command.outcome));
  }

  editSectionIntro(command: { outcome: DocNominationFileOutcomeEnum; html: string }): void {
    this.#messages.push(new OfficialReportSectionIntroEdited(this.id, command.outcome, command.html));
  }

  resetSectionIntro(command: { outcome: DocNominationFileOutcomeEnum }): void {
    this.#messages.push(new OfficialReportSectionIntroReset(this.id, command.outcome));
  }
}
