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

export type AgendaEvent = AgendaCreated;

export class Agenda {
  readonly #messages: AgendaEvent[] = [];

  private constructor(readonly id: Id<'AgendaId'>) {}

  get messages(): readonly AgendaEvent[] {
    return this.#messages;
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
    const agenda = new Agenda(makeId('AgendaId'));
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
