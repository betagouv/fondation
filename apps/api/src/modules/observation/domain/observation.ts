import { Id, makeId } from 'src/utils/id';
import { ObservationFollowUp } from './observation-follow-up';

export class UserNotAllowedToAttachScreenshotsError extends Error {
  constructor() {
    super();
  }
}

export class UserNotAllowedToWriteCommentError extends Error {
  constructor() {
    super();
  }
}

export class ObservationCreated {
  constructor(
    readonly id: string,
    readonly nominationFileId: string,
    readonly magistratId: string,
    readonly dateReception: Date,
    readonly createdByUserId: string,
    readonly description: string,
  ) {}
}

export class ObservationFilesAttached {
  constructor(
    readonly observationId: string,
    readonly files: readonly { id: string }[],
  ) {}
}

export class ObservationDeleted {
  constructor(readonly id: string) {}
}

export class ObservationUpdated {
  constructor(
    readonly id: string,
    readonly data: {
      dateReception: Date;
      magistratId: string;
      description: string;
    },
  ) {}
}

export class ObservationFilesDetached {
  constructor(
    readonly observationId: string,
    readonly fileIds: readonly string[],
  ) {}
}

export class ObservationMemberCommentWritten {
  constructor(
    readonly observationId: string,
    readonly userId: string,
    readonly comment: string,
  ) {}
}

export class ObservationMemberCommentScreenshotsAttached {
  constructor(
    readonly observationId: string,
    readonly userId: string,
    readonly files: readonly { id: string }[],
  ) {}
}

export class ObservationFollowedUp {
  constructor(
    readonly id: string,
    readonly followUp: ObservationFollowUp | null,
    readonly userId: string | null,
  ) {}
}

type ObservationEvent =
  | ObservationCreated
  | ObservationFilesAttached
  | ObservationDeleted
  | ObservationUpdated
  | ObservationFilesDetached
  | ObservationMemberCommentWritten
  | ObservationMemberCommentScreenshotsAttached
  | ObservationFollowedUp;

export class Observation {
  private constructor(
    readonly id: Id<'ObservationId'>,
    readonly nominationFileId: string,
    readonly magistratId: string,
    readonly dateReception: Date,
  ) {}

  static create(command: {
    nominationFileId: string;
    magistratId: string;
    dateReception: Date;
    createdByUserId: string;
    description: string | null | undefined;
    files: readonly { id: string }[];
  }): Observation {
    const id = makeId('ObservationId');
    const observation = new Observation(
      id,
      command.nominationFileId,
      command.magistratId,
      command.dateReception,
    );

    observation.#messages.push(
      new ObservationCreated(
        id,
        command.nominationFileId,
        command.magistratId,
        command.dateReception,
        command.createdByUserId,
        (command.description || '').trim(),
      ),
    );

    if (command.files.length > 0) {
      observation.attachFiles({ files: command.files });
    }

    return observation;
  }

  static from(props: {
    id: string;
    nominationFileId: string;
    magistratId: string;
    dateReception: Date;
  }): Observation {
    return new Observation(
      makeId('ObservationId', props.id),
      props.nominationFileId,
      props.magistratId,
      props.dateReception,
    );
  }

  attachFiles(command: { files: readonly { id: string }[] }): void {
    if (command.files.length === 0) return;

    this.#messages.push(new ObservationFilesAttached(this.id, command.files));
  }

  delete(): void {
    this.#messages.push(new ObservationDeleted(this.id));
  }

  update(command: {
    dateReception: Date;
    magistratId: string;
    description: string | undefined | null;
  }): void {
    this.#messages.push(
      new ObservationUpdated(this.id, {
        ...command,
        description: command.description?.trim() ?? '',
      }),
    );
  }

  detachFiles(command: { fileIds: readonly string[] }): void {
    if (command.fileIds.length === 0) return;

    this.#messages.push(new ObservationFilesDetached(this.id, command.fileIds));
  }

  attachMemberCommentScreenshots(command: {
    userId: string;
    reporterIds: readonly string[];
    files: readonly { id: string }[];
  }): void {
    if (!command.reporterIds.includes(command.userId)) {
      throw new UserNotAllowedToAttachScreenshotsError();
    }

    if (command.files.length === 0) return;

    this.#messages.push(
      new ObservationMemberCommentScreenshotsAttached(
        this.id,
        command.userId,
        command.files,
      ),
    );
  }

  writeMemberComment(command: {
    userId: string;
    reporterIds: readonly string[];
    comment: string;
  }): void {
    if (!command.reporterIds.includes(command.userId)) {
      throw new UserNotAllowedToWriteCommentError();
    }

    this.#messages.push(
      new ObservationMemberCommentWritten(
        this.id,
        command.userId,
        command.comment,
      ),
    );
  }

  followUpWith(command: {
    followUp: string | null;
    comment: string | null;
    userId: string | null;
  }): void {
    if (command.followUp === null) {
      this.#messages.push(new ObservationFollowedUp(this.id, null, null));
      return;
    }

    const followUp = ObservationFollowUp.from({
      followUp: command.followUp,
      comment: command.comment,
    });
    this.#messages.push(
      new ObservationFollowedUp(this.id, followUp, command.userId),
    );
  }

  readonly #messages: ObservationEvent[] = [];
  get messages(): readonly ObservationEvent[] {
    return this.#messages;
  }
}
