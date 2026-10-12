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

export class ObservationAlreadyExist extends Error {
  constructor(
    readonly nominationFileId: string,
    readonly magistratId: string,
  ) {
    super();
  }
}

export class ObservationCreated {
  constructor(
    readonly id: string,
    readonly nominationFileId: string,
    readonly sessionId: string,
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

export class ObservationFileLinked {
  constructor(
    readonly id: string,
    readonly file: { observationId: string; fileId: string },
  ) {}
}

export class ObservationDeleted {
  constructor(readonly id: string) {}
}

// an observant is heard once per session for all their observations: without any left, the audition has no subject
export class ObservantAuditionDropped {
  constructor(
    readonly sessionId: string,
    readonly magistratId: string,
    readonly userId: string,
    readonly impersonatorId: string | null,
  ) {}
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
  | ObservationFollowedUp
  | ObservationFileLinked
  | ObservantAuditionDropped;

export class Observation {
  private constructor(
    readonly id: Id<'ObservationId'>,
    readonly nominationFileId: string,
    readonly sessionId: string,
    readonly magistratId: string,
    readonly dateReception: Date,
  ) {}

  static create(command: {
    nominationFile: {
      id: string;
      observations: readonly { magistratId: string }[];
    };
    magistratId: string;
    dateReception: Date;
    createdByUserId: string;
    description: string | null | undefined;
    sessionId: string;
    linkedFiles: readonly { observationId: string; fileId: string }[];
    files: readonly { id: string }[];
  }): Observation {
    this.assertNominationFileIsObservable(command.magistratId, command.nominationFile);

    const id = makeId('ObservationId');
    const observation = new Observation(
      id,
      command.nominationFile.id,
      command.sessionId,
      command.magistratId,
      command.dateReception,
    );

    observation.#messages.push(
      new ObservationCreated(
        id,
        command.nominationFile.id,
        command.sessionId,
        command.magistratId,
        command.dateReception,
        command.createdByUserId,
        (command.description || '').trim(),
      ),
    );

    observation.attachFiles({ files: command.files });
    observation.linkFiles({ files: command.linkedFiles });

    return observation;
  }

  static from(props: {
    id: string;
    nominationFileId: string;
    sessionId: string;
    magistratId: string;
    dateReception: Date;
  }): Observation {
    return new Observation(
      makeId('ObservationId', props.id),
      props.nominationFileId,
      props.sessionId,
      props.magistratId,
      props.dateReception,
    );
  }

  attachFiles(command: { files: readonly { id: string }[] }): void {
    if (command.files.length === 0) return;

    this.#messages.push(new ObservationFilesAttached(this.id, command.files));
  }

  linkFiles(command: { files: readonly { observationId: string; fileId: string }[] }): void {
    if (command.files.length === 0) return;

    for (const file of command.files) {
      this.#messages.push(new ObservationFileLinked(this.id, file));
    }
  }

  delete(command: { impersonatorId: string | null; isLastOfObservant: boolean; userId: string }): void {
    this.#messages.push(new ObservationDeleted(this.id));
    if (command.isLastOfObservant) this.dropObservantAudition(command);
  }

  private dropObservantAudition(command: { impersonatorId: string | null; userId: string }): void {
    this.#messages.push(
      new ObservantAuditionDropped(this.sessionId, this.magistratId, command.userId, command.impersonatorId),
    );
  }

  update(command: {
    dateReception: Date;
    description: string | undefined | null;
    impersonatorId: string | null;
    // whether the observant being replaced has no other observation in the session
    isLastOfObservant: boolean;
    magistratId: string;
    userId: string;
  }): void {
    this.#messages.push(
      new ObservationUpdated(this.id, {
        dateReception: command.dateReception,
        description: command.description?.trim() ?? '',
        magistratId: command.magistratId,
      }),
    );
    if (command.magistratId !== this.magistratId && command.isLastOfObservant)
      this.dropObservantAudition(command);
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
      new ObservationMemberCommentScreenshotsAttached(this.id, command.userId, command.files),
    );
  }

  writeMemberComment(command: { userId: string; reporterIds: readonly string[]; comment: string }): void {
    if (!command.reporterIds.includes(command.userId)) {
      throw new UserNotAllowedToWriteCommentError();
    }

    this.#messages.push(new ObservationMemberCommentWritten(this.id, command.userId, command.comment));
  }

  followUpWith(command: { followUp: string | null; comment: string | null; userId: string | null }): void {
    if (command.followUp === null) {
      this.#messages.push(new ObservationFollowedUp(this.id, null, null));
      return;
    }

    const followUp = ObservationFollowUp.from({
      followUp: command.followUp,
      comment: command.comment,
    });
    this.#messages.push(new ObservationFollowedUp(this.id, followUp, command.userId));
  }

  private static assertNominationFileIsObservable(
    magistratId: string,
    nominationFile: {
      id: string;
      observations: readonly { magistratId: string }[];
    },
  ): asserts nominationFile {
    const observationExists = nominationFile.observations.some((o) => o.magistratId === magistratId);

    if (observationExists) {
      throw new ObservationAlreadyExist(nominationFile.id, magistratId);
    }
  }

  readonly #messages: ObservationEvent[] = [];
  get messages(): readonly ObservationEvent[] {
    return this.#messages;
  }
}
