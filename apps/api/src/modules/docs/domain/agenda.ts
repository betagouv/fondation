import { makeId } from 'src/utils/id';

export class AgendaCreated {
  constructor(
    readonly agendaId: string,
    readonly sessionId: string,
    readonly authorId: string,
    readonly nominationFileIds: readonly string[],
  ) {}
}

export type AgendaEvent = AgendaCreated;

export class Agenda {
  readonly #messages: AgendaEvent[] = [];

  private constructor(readonly id: string) {}

  get messages(): readonly AgendaEvent[] {
    return this.#messages;
  }

  static create(props: {
    sessionId: string;
    authorId: string;
    nominationFileIds: readonly string[];
  }): Agenda {
    const agenda = new Agenda(makeId('AgendaId'));

    agenda.#messages.push(
      new AgendaCreated(
        agenda.id,
        props.sessionId,
        props.authorId,
        props.nominationFileIds,
      ),
    );

    return agenda;
  }
}
