import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';
import { assertIsDefined } from 'src/utils/is-defined';

import { AgendaNominationFile } from './agenda-nomination-file';
import { AgendaFilesDiff, AgendaMetadataDiff, AgendaSnapshot } from './agenda-snapshot';

export type AgendaChairman = {
  id: string;
  firstName: string;
  lastName: string;
  gender: GenderEnum;
  title: UserTitleEnum | null;
  displayTitle: string | null;
};

export class AgendaCreated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly sessionId: Id<'SessionId'>,
    readonly authorId: Id<'AuthorId'>,
    readonly chairman: {
      id: Id<'ChairmanId'>;
      firstName: string;
      lastName: string;
      gender: GenderEnum;
      title: UserTitleEnum | null;
      displayTitle: string | null;
    },
    readonly date: Date,
    readonly sessionMeetingDate: Date,
    readonly nominationFiles: readonly AgendaNominationFile[],
  ) {}
}

export class AgendaDeleted {
  constructor(readonly agendaId: Id<'AgendaId'>) {}
}

export class AgendaDraftOpened {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly authorId: string | null,
  ) {}
}

export class AgendaDraftEdited {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly authorId: string,
  ) {}
}

export class AgendaDraftUpdatedBySystem {
  constructor(readonly agendaId: Id<'AgendaId'>) {}
}

export class AgendaValidated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly validatedAt: Date,
    readonly validatedBy: Id<'AuthorId'>,
  ) {}
}

export class AgendaDraftDiscarded {
  constructor(readonly agendaId: Id<'AgendaId'>) {}
}

export class AgendaMetadataUpdated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly authorId: Id<'AuthorId'>,
    readonly update: Extract<AgendaMetadataDiff, { hasAny: true }>['metadata'],
  ) {}
}

export class AgendaFilesUpdated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly authorId: Id<'AuthorId'>,
    readonly sessionId: Id<'SessionId'>,
    readonly update: Pick<Extract<AgendaFilesDiff, { hasAny: true }>, 'added' | 'removed'>,
  ) {}
}

export class AgendaFilesReportersUpdated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly files: readonly {
      isOutdated: boolean;
      nominationFileId: string;
      reporters: readonly string[];
    }[],
  ) {}
}

export class AgendaFileBlockEdited {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly nominationFileId: string,
    readonly html: string,
    readonly outdated: boolean,
    readonly authorId: string,
  ) {}
}

export class AgendaFileBlockReset {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly nominationFileId: string,
  ) {}
}

export type AgendaEvent =
  | AgendaCreated
  | AgendaMetadataUpdated
  | AgendaFilesUpdated
  | AgendaDeleted
  | AgendaDraftOpened
  | AgendaDraftEdited
  | AgendaDraftUpdatedBySystem
  | AgendaValidated
  | AgendaDraftDiscarded
  | AgendaFileBlockEdited
  | AgendaFileBlockReset
  | AgendaFilesReportersUpdated;

export class EmptyAgenda extends Error {}

export class AgendaAlreadyValidated extends Error {}
export class AgendaDocumentNotStored extends Error {}

export class AgendaWithoutValidatedVersion extends Error {}

export class UnknownAgendaFileBlock extends Error {}

export class AgendaFilesAlreadyReported extends Error {
  constructor(readonly fileIds: readonly string[]) {
    super();
  }
}

export class Agenda {
  readonly #messages: AgendaEvent[] = [];
  #actorId: string | null;
  #isDocumentStored: boolean;
  #isValidated: boolean;

  private constructor(
    readonly id: Id<'AgendaId'>,
    readonly sessionId: Id<'SessionId'>,
    readonly officialReportId: Id<'OfficialReportId'> | null,
    actorId: string | null,
    isDocumentStored: boolean,
    isValidated: boolean,
    private readonly snapshot?: AgendaSnapshot,
  ) {
    this.#actorId = actorId;
    this.#isDocumentStored = isDocumentStored;
    this.#isValidated = isValidated;
  }

  get messages(): readonly AgendaEvent[] {
    return this.#messages;
  }

  static from(props: {
    id: Id<'AgendaId'>;
    sessionId: Id<'SessionId'>;
    officialReportId: Id<'OfficialReportId'> | null;
    /** whoever is acting on the agenda: the draft a change opens is theirs, not the previous author's */
    actorId?: string | null;
    isDocumentStored?: boolean;
    isValidated?: boolean;
    snapshot?: AgendaSnapshot;
  }): Agenda {
    return new Agenda(
      props.id,
      props.sessionId,
      props.officialReportId,
      props.actorId ?? null,
      props.isDocumentStored ?? false,
      props.isValidated ?? false,
      props.snapshot,
    );
  }

  /** a validated version never changes: editing it forks the draft everything is then written into */
  private openDraft(): void {
    if (this.#isValidated) {
      this.#messages.push(new AgendaDraftOpened(this.id, this.#actorId));
      this.#isValidated = false;
    } else if (this.#actorId) {
      this.#messages.push(new AgendaDraftEdited(this.id, this.#actorId));
    }

    if (!this.#actorId) this.#messages.push(new AgendaDraftUpdatedBySystem(this.id));
  }

  validate(command: { at: Date; authorId: string }): void {
    if (this.#isValidated) throw new AgendaAlreadyValidated();
    if (!this.#isDocumentStored) throw new AgendaDocumentNotStored();

    this.#messages.push(new AgendaValidated(this.id, command.at, makeId('AuthorId', command.authorId)));
    this.#isValidated = true;
  }

  discardDraft(command: { hasValidatedVersion: boolean }): void {
    if (this.#isValidated) return;
    if (!command.hasValidatedVersion) throw new AgendaWithoutValidatedVersion();

    this.#messages.push(new AgendaDraftDiscarded(this.id));
    this.#isValidated = true;
  }

  updateMetadata(command: {
    authorId: string;
    date: DateOnly;
    sessionMeetingDate: DateOnly;
    chairmanId: string;
  }): AgendaMetadataDiff {
    const diff = assertIsDefined(this.snapshot).diffMetadata(command);
    if (diff.hasAny) {
      this.openDraft();
      this.#messages.push(
        new AgendaMetadataUpdated(this.id, makeId('AuthorId', command.authorId), diff.metadata),
      );
    }

    return diff;
  }

  updateFiles(command: {
    authorId: string;
    nominationFileIds: Set<string>;
    reportedNominationFileIds: ReadonlySet<string>;
  }): AgendaFilesDiff {
    if (command.nominationFileIds.size === 0) throw new EmptyAgenda();

    const diff = assertIsDefined(this.snapshot).diffFiles({
      fileIds: new Set(command.nominationFileIds),
    });

    if (!diff.hasAny) return diff;

    const alreadyPresented = diff.added.filter((nominationFileId) =>
      command.reportedNominationFileIds.has(nominationFileId),
    );
    if (alreadyPresented.length > 0) throw new AgendaFilesAlreadyReported(alreadyPresented);

    this.openDraft();
    this.#messages.push(
      new AgendaFilesUpdated(this.id, makeId('AuthorId', command.authorId), this.sessionId, diff),
    );

    return diff;
  }

  updateFilesReporters(command: {
    nominationFiles: readonly { id: string; reporters: readonly string[] }[];
  }): void {
    if (command.nominationFiles.length === 0) throw new EmptyAgenda();

    const diff = assertIsDefined(this.snapshot).diffReporters(command);
    if (diff.hasAny) {
      this.openDraft();
      this.#messages.push(new AgendaFilesReportersUpdated(this.id, diff.updated));
    }
  }

  delete(): void {
    this.#messages.push(new AgendaDeleted(this.id));
  }

  editFileBlock(command: { authorId: string; fileId: bigint; html: string; outdated: boolean }): void {
    const nominationFileId = this.blockProposition(command);

    this.openDraft();
    this.#messages.push(
      new AgendaFileBlockEdited(this.id, nominationFileId, command.html, command.outdated, command.authorId),
    );
  }

  resetFileBlock(command: { fileId: bigint }): void {
    const nominationFileId = this.blockProposition(command);

    this.openDraft();
    this.#messages.push(new AgendaFileBlockReset(this.id, nominationFileId));
  }

  private blockProposition(command: { fileId: bigint }): string {
    const nominationFileId = assertIsDefined(this.snapshot).nominationFileIdOf(command.fileId);
    if (!nominationFileId) throw new UnknownAgendaFileBlock();

    return nominationFileId;
  }

  static create(props: {
    authorId: string;
    chairman: {
      displayTitle: string | null;
      firstName: string;
      gender: GenderEnum;
      id: string;
      lastName: string;
      title: UserTitleEnum | null;
    };
    date: DateOnly;
    nominationFiles: readonly AgendaNominationFile[];
    reportedNominationFileIds: ReadonlySet<string>;
    sessionId: string;
    sessionMeetingDate: DateOnly;
  }): Agenda {
    if (props.nominationFiles.length === 0) throw new EmptyAgenda();

    const alreadyPresented = props.nominationFiles.flatMap(({ id }) =>
      props.reportedNominationFileIds.has(id) ? [id] : [],
    );
    if (alreadyPresented.length > 0) throw new AgendaFilesAlreadyReported(alreadyPresented);

    const agenda = Agenda.from({
      id: makeId('AgendaId'),
      sessionId: makeId('SessionId', props.sessionId),
      officialReportId: null,
    });

    agenda.#messages.push(
      new AgendaCreated(
        agenda.id,
        makeId('SessionId', props.sessionId),
        makeId('AuthorId', props.authorId),
        { ...props.chairman, id: makeId('ChairmanId', props.chairman.id) },
        props.date.toDate(),
        props.sessionMeetingDate.toDate(),
        props.nominationFiles,
      ),
    );

    return agenda;
  }
}
