import { Gender } from 'shared-models';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';
import { AgendaNominationFile } from './agenda-nomination-file';

export class AgendaCreated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly sessionId: Id<'SessionId'>,
    readonly authorId: Id<'AuthorId'>,
    readonly chairman: {
      id: Id<'ChairmanId'>;
      firstName: string;
      lastName: string;
      gender: Gender;
      title: string | null;
    },
    readonly date: Date,
    readonly sessionMeetingDate: Date,
    readonly nominationFiles: readonly AgendaNominationFile[],
  ) {}
}

export class AgendaUpdated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly authorId: Id<'AuthorId'>,
    readonly chairman: {
      id: Id<'ChairmanId'>;
      firstName: string;
      lastName: string;
      gender: Gender;
      title: string | null;
    },
    readonly date: Date,
    readonly sessionMeetingDate: Date,
    readonly nominationFiles: readonly AgendaNominationFile[],
  ) {}
}

export class AgendaDeleted {
  constructor(readonly agendaId: Id<'AgendaId'>) {}
}

export type AgendaEvent = AgendaCreated | AgendaUpdated | AgendaDeleted;

export class EmptyAgenda extends Error {
  constructor(readonly agendaId: string) {
    super();
  }
}

export class Agenda {
  readonly #messages: AgendaEvent[] = [];

  private constructor(
    readonly id: Id<'AgendaId'>,
    readonly sessionId: Id<'SessionId'>,
  ) {}

  get messages(): readonly AgendaEvent[] {
    return this.#messages;
  }

  static from(props: {
    id: Id<'AgendaId'>;
    sessionId: Id<'SessionId'>;
  }): Agenda {
    return new Agenda(props.id, props.sessionId);
  }

  update(command: {
    authorId: string;
    date: DateOnly;
    sessionMeetingDate: DateOnly;
    nominationFiles: readonly AgendaNominationFile[];
    chairman: {
      id: string;
      firstName: string;
      lastName: string;
      gender: Gender;
      title: string | null;
    };
  }): void {
    if (command.nominationFiles.length === 0) throw new EmptyAgenda(this.id);

    this.#messages.push(
      new AgendaUpdated(
        this.id,
        makeId('AuthorId', command.authorId),
        { ...command.chairman, id: makeId('ChairmanId', command.chairman.id) },
        command.date.toDate(),
        command.sessionMeetingDate.toDate(),
        command.nominationFiles,
      ),
    );
  }

  delete(): void {
    this.#messages.push(new AgendaDeleted(this.id));
  }

  static create(props: {
    sessionId: string;
    authorId: string;
    chairman: {
      id: string;
      firstName: string;
      lastName: string;
      gender: Gender;
      title: string | null;
    };
    date: DateOnly;
    sessionMeetingDate: DateOnly;
    nominationFiles: readonly AgendaNominationFile[];
  }): Agenda {
    const agenda = new Agenda(
      makeId('AgendaId'),
      makeId('SessionId', props.sessionId),
    );

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
