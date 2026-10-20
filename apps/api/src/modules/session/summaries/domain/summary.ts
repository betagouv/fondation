import { Id, makeId } from 'src/utils/id';

export class SummaryCreated {
  constructor(
    readonly sessionId: string,
    readonly nominationFileId: Id<'SummaryId'>,
  ) {}
}

export class AttachedFilesToSummary {
  constructor(
    readonly id: Id<'SummaryId'>,
    readonly fileIds: readonly string[],
  ) {}
}

export class DetachedFilesFromSummary {
  constructor(
    readonly id: Id<'SummaryId'>,
    readonly fileIds: readonly string[],
  ) {}
}

export class IncludedFilesInSummaryContent {
  constructor(
    readonly id: Id<'SummaryId'>,
    readonly fileIds: readonly string[],
  ) {}
}

export class SummaryContentWritten {
  constructor(
    readonly id: Id<'SummaryId'>,
    readonly content: string,
    readonly newAuthorId: string | null,
  ) {}
}

export class UpdatedSummaryReaderList {
  constructor(
    readonly id: Id<'SummaryId'>,
    readonly readerIds: readonly string[],
  ) {}
}

type SummaryMessage =
  | SummaryCreated
  | AttachedFilesToSummary
  | DetachedFilesFromSummary
  | IncludedFilesInSummaryContent
  | SummaryContentWritten
  | UpdatedSummaryReaderList;

export class Summary {
  constructor(
    readonly id: Id<'SummaryId'>,
    readonly authorId: string | null,
    private readonly readerIds: ReadonlySet<string>,
  ) {}

  static from(props: {
    authorId: string | null;
    id: string;
    readerIds: readonly string[];
    sessionId: string;
    sessionIsArchived: boolean;
  }) {
    if (props.sessionIsArchived) throw new SummarySessionIsArchived(props.sessionId);

    return new Summary(makeId('SummaryId', props.id), props.authorId, new Set(props.readerIds));
  }

  static create(props: { nominationFileId: string; sessionId: string; sessionIsArchived: boolean }): Summary {
    if (props.sessionIsArchived) throw new SummarySessionIsArchived(props.sessionId);

    const summary = new Summary(makeId('SummaryId', props.nominationFileId), null, new Set());

    summary.#messages.push(new SummaryCreated(props.sessionId, summary.id));

    return summary;
  }

  attachFiles(command: { fileIds: readonly string[] }): void {
    if (command.fileIds.length === 0) return;

    this.#messages.push(new AttachedFilesToSummary(this.id, command.fileIds));
  }

  detachFiles(command: { fileIds: readonly string[] }): void {
    if (command.fileIds.length === 0) return;

    this.#messages.push(new DetachedFilesFromSummary(this.id, command.fileIds));
  }

  includeFilesIntoContent(command: { fileIds: readonly string[] }): void {
    if (command.fileIds.length === 0) return;

    this.#messages.push(new IncludedFilesInSummaryContent(this.id, command.fileIds));
  }

  /** a reader deactivated since stays a reader, but no longer joins a summary */
  updateReadersList(command: { availableUserIds: Set<string>; readerIds: readonly string[] }): void {
    for (const readerId of command.readerIds) {
      if (!command.availableUserIds.has(readerId) && !this.readerIds.has(readerId)) {
        throw new UnknownReader(readerId);
      }
    }

    this.#messages.push(
      new UpdatedSummaryReaderList(
        this.id,
        this.authorId ? command.readerIds.filter((id) => id !== this.authorId) : command.readerIds,
      ),
    );
  }

  writeContent(command: { userId: string; content: string }): void {
    if (this.authorId && command.userId !== this.authorId) {
      throw new OnlyAuthorCanWriteSummary(this.id, this.authorId, command.userId);
    }

    const newAuthorId = this.authorId ? null : command.userId;
    this.#messages.push(new SummaryContentWritten(this.id, command.content, newAuthorId));
  }

  readonly #messages: SummaryMessage[] = [];
  get messages(): readonly SummaryMessage[] {
    return this.#messages;
  }
}

export class SummarySessionIsArchived extends Error {
  constructor(readonly sessionId: string) {
    super();
  }
}

export class UnknownReader extends Error {
  constructor(readonly readerId: string) {
    super();
  }
}

export class OnlyAuthorCanWriteSummary extends Error {
  constructor(
    readonly nominationFileId: string,
    readonly authorId: string,
    readonly userId: string,
  ) {
    super();
  }
}
