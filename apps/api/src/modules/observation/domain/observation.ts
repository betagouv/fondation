import { Id, makeId } from 'src/utils/id';

export class ObservationCreated {
  constructor(
    readonly id: string,
    readonly nominationFileId: string,
    readonly magistratId: string,
    readonly dateReception: Date,
    readonly createdByUserId: string,
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

type ObservationEvent =
  | ObservationCreated
  | ObservationFilesAttached
  | ObservationDeleted;

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

  readonly #messages: ObservationEvent[] = [];
  get messages(): readonly ObservationEvent[] {
    return this.#messages;
  }
}
