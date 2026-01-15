import { Id, makeId } from 'src/utils/id';

export class SummaryCreated {
  constructor(
    readonly authorId: string,
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
  ) {}

  static from(props: { id: string; authorId: string | null }) {
    return new Summary(makeId('SummaryId', props.id), props.authorId);
  }

  static create(props: {
    authorId: string;
    sessionId: string;
    nominationFileId: string;
  }): Summary {
    const summary = new Summary(
      makeId('SummaryId', props.nominationFileId),
      props.authorId,
    );

    summary.#messages.push(
      new SummaryCreated(props.authorId, props.sessionId, summary.id),
    );

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

    this.#messages.push(
      new IncludedFilesInSummaryContent(this.id, command.fileIds),
    );
  }

  updateReadersList(command: {
    availableUserIds: Set<string>;
    readerIds: readonly string[];
  }): void {
    for (const readerId of command.readerIds) {
      if (!command.availableUserIds.has(readerId)) {
        throw new UnknownReader(readerId);
      }
    }

    this.#messages.push(
      new UpdatedSummaryReaderList(
        this.id,
        this.authorId
          ? command.readerIds.filter((id) => id !== this.authorId)
          : command.readerIds,
      ),
    );
  }

  writeContent(command: { userId: string; content: string }): void {
    if (!this.authorId) throw new NoAuthorAvailable(this.id);

    if (command.userId !== this.authorId) {
      throw new OnlyAuthorCanWriteSummary(
        this.id,
        this.authorId,
        command.userId,
      );
    }

    this.#messages.push(new SummaryContentWritten(this.id, command.content));
  }

  readonly #messages: SummaryMessage[] = [];
  get messages(): readonly SummaryMessage[] {
    return this.#messages;
  }
}

export class UnknownReader extends Error {
  constructor(readonly readerId: string) {
    super();
  }
}

export class NoAuthorAvailable extends Error {
  constructor(readonly nominationFileId: string) {
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
