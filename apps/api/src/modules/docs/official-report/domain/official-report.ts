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
    readonly validatedBy: Id<'AuthorId'>,
  ) {}
}

export class OfficialReportInvalidated {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly diff: OfficialReportSnapshotDiff,
  ) {}
}

export class OfficialReportDraftOpened {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly authorId: string | null,
  ) {}
}

export class OfficialReportDraftUpdatedBySystem {
  constructor(readonly officialReportId: Id<'OfficialReportId'>) {}
}

export class OfficialReportDraftEdited {
  constructor(
    readonly officialReportId: Id<'OfficialReportId'>,
    readonly authorId: string,
  ) {}
}

export class OfficialReportDraftDiscarded {
  constructor(readonly officialReportId: Id<'OfficialReportId'>) {}
}

export type OfficialReportEvent =
  | OfficialReportCreated
  | OfficialReportUpdated
  | OfficialReportDeleted
  | OfficialReportIntroEdited
  | OfficialReportIntroReset
  | OfficialReportConclusionEdited
  | OfficialReportConclusionReset
  | OfficialReportFileReset
  | OfficialReportSectionTitleEdited
  | OfficialReportSectionTitleReset
  | OfficialReportSectionIntroEdited
  | OfficialReportSectionIntroReset
  | OfficialReportValidated
  | OfficialReportInvalidated
  | OfficialReportDraftOpened
  | OfficialReportDraftEdited
  | OfficialReportDraftUpdatedBySystem
  | OfficialReportDraftDiscarded;

export class OfficialReportDocumentNotStored extends Error {}

export class OfficialReportAlreadyValidated extends Error {}

export class OfficialReportWithoutValidatedVersion extends Error {}

type OfficialReportState = { isDocumentStored: boolean; isValidated: boolean };

/** whoever is acting on the report: the draft a change opens is theirs, not the previous author's */
type OfficialReportActor = { actorId?: string | null };

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
    private readonly actorId: string | null = null,
  ) {}

  static from(
    props: { id: Id<'OfficialReportId'>; snapshot: OfficialReportSnapshot } & OfficialReportActor &
      OfficialReportState,
  ) {
    return new OfficialReport(
      props.id,
      props.snapshot,
      { isDocumentStored: props.isDocumentStored, isValidated: props.isValidated },
      props.actorId ?? null,
    );
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
      { isDocumentStored: false, isValidated: false },
    );

    report.#messages.push(new OfficialReportCreated(report.id, command.authorId, report.snapshot));

    return report;
  }

  /** a validated version never changes: editing it forks the draft everything is then written into */
  private openDraft(): void {
    if (this.state.isValidated) {
      this.#messages.push(new OfficialReportDraftOpened(this.id, this.actorId));
      this.state.isValidated = false;
    } else if (this.actorId) {
      this.#messages.push(new OfficialReportDraftEdited(this.id, this.actorId));
    }

    if (!this.actorId) this.#messages.push(new OfficialReportDraftUpdatedBySystem(this.id));
  }

  validate(command: { at: Date; authorId: string }): void {
    if (this.state.isValidated) throw new OfficialReportAlreadyValidated();
    if (!this.state.isDocumentStored) throw new OfficialReportDocumentNotStored();

    this.#messages.push(
      new OfficialReportValidated(this.id, command.at, makeId('AuthorId', command.authorId)),
    );
    this.state.isValidated = true;
  }

  discardDraft(command: { hasValidatedVersion: boolean }): void {
    if (this.state.isValidated) return;
    if (!command.hasValidatedVersion) throw new OfficialReportWithoutValidatedVersion();

    this.#messages.push(new OfficialReportDraftDiscarded(this.id));
    this.state.isValidated = true;
  }

  invalidate(command: InvalidateOfficialReportCommand): void {
    // the report follows the agenda's sentence on its own: the reader was never asked to choose
    if (command.type === 'AgendaFileBlockEdited') {
      if (this.snapshot.holdsFile(command.payload.nominationFileId)) this.resetFile(command.payload);
      return;
    }

    const diff = this.snapshot.invalidate(command);
    if (!diff.hasAny) return;

    this.openDraft();
    this.#messages.push(new OfficialReportInvalidated(this.id, diff));
  }

  update(command: UpdateOfficialReportCommand): void {
    const { next, diff } = this.snapshot.update(command.officialReport);

    this.openDraft();
    if (diff.hasAny) this.#messages.push(new OfficialReportInvalidated(this.id, diff));
    this.#messages.push(new OfficialReportUpdated(this.id, command.authorId, next, diff));
  }

  delete(): void {
    this.#messages.push(new OfficialReportDeleted(this.id));
  }

  editIntro(command: { html: string; outdated: boolean }): void {
    this.openDraft();
    this.#messages.push(new OfficialReportIntroEdited(this.id, command.html, command.outdated));
  }

  resetIntro(): void {
    this.openDraft();
    this.#messages.push(new OfficialReportIntroReset(this.id));
  }

  editConclusion(command: { html: string; outdated: boolean }): void {
    this.openDraft();
    this.#messages.push(new OfficialReportConclusionEdited(this.id, command.html, command.outdated));
  }

  resetConclusion(): void {
    this.openDraft();
    this.#messages.push(new OfficialReportConclusionReset(this.id));
  }

  resetFile(command: { nominationFileId: string }): void {
    this.openDraft();
    this.#messages.push(new OfficialReportFileReset(this.id, command.nominationFileId));
  }

  editSectionTitle(command: { outcome: DocNominationFileOutcomeEnum; text: string }): void {
    this.openDraft();
    this.#messages.push(new OfficialReportSectionTitleEdited(this.id, command.outcome, command.text));
  }

  resetSectionTitle(command: { outcome: DocNominationFileOutcomeEnum }): void {
    this.openDraft();
    this.#messages.push(new OfficialReportSectionTitleReset(this.id, command.outcome));
  }

  editSectionIntro(command: { outcome: DocNominationFileOutcomeEnum; html: string }): void {
    this.openDraft();
    this.#messages.push(new OfficialReportSectionIntroEdited(this.id, command.outcome, command.html));
  }

  resetSectionIntro(command: { outcome: DocNominationFileOutcomeEnum }): void {
    this.openDraft();
    this.#messages.push(new OfficialReportSectionIntroReset(this.id, command.outcome));
  }
}
