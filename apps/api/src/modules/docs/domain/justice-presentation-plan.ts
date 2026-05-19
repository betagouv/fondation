import { Gender, Magistrat, Role } from 'shared-models';

import { UserDutyEnum, UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';
import { TimeOnly } from 'src/utils/time-only';

export class JusticePresentationPlanCreated {
  constructor(
    readonly id: Id<'JusticePresentationPlanId'>,
    readonly authorId: string,
    readonly formation: Magistrat.Formation,
    readonly state: JusticePresentationPlanState,
  ) {}
}

export class JusticePresentationPlanUpdated {
  constructor(
    readonly id: Id<'JusticePresentationPlanId'>,
    readonly authorId: string,
    readonly state: JusticePresentationPlanState,
  ) {}
}

export class JusticePresentationPlanDeleted {
  constructor(readonly id: Id<'JusticePresentationPlanId'>) {}
}

export class JusticePresentationPlanPresented {
  constructor(
    readonly id: Id<'JusticePresentationPlanId'>,
    readonly endTime: TimeOnly,
  ) {}
}

export class JusticePresentationPlanUnPresented {
  constructor(readonly id: Id<'JusticePresentationPlanId'>) {}
}

export type JusticePresentationPlanMessage =
  | JusticePresentationPlanCreated
  | JusticePresentationPlanUpdated
  | JusticePresentationPlanDeleted
  | JusticePresentationPlanPresented
  | JusticePresentationPlanUnPresented;

export class UnknownPresentationPlanSecretary extends Error {}
export class UnknownPresentationPlanChairman extends Error {}
export class AgendaIsNotCompatibleWithPresentationPlan extends Error {}
export class EmptyAgendaList extends Error {}
export class JusticePresentationPlanEndTimeShouldBeBeforeStartTime extends Error {}

export class JusticePresentationPlan {
  readonly #messages: JusticePresentationPlanMessage[] = [];
  get messages(): readonly JusticePresentationPlanMessage[] {
    return this.#messages;
  }

  private constructor(
    readonly id: Id<'JusticePresentationPlanId'>,
    readonly formation: Magistrat.Formation,
    readonly startTime: TimeOnly,
  ) {}

  static from(props: {
    id: string;
    formation: Magistrat.Formation;
    startTime: TimeOnly;
  }): JusticePresentationPlan {
    return new JusticePresentationPlan(
      makeId('JusticePresentationPlanId', props.id),
      props.formation,
      props.startTime,
    );
  }

  static create(command: CreateJusticePresentationPlanCommand): JusticePresentationPlan {
    const formation = this.extractFormation(command.agendas);
    const plan = new JusticePresentationPlan(makeId('JusticePresentationPlanId'), formation, command.time);

    plan.#messages.push(
      new JusticePresentationPlanCreated(plan.id, command.authorId, plan.formation, plan.buildState(command)),
    );

    return plan;
  }

  update(command: UpdateJusticePresentationPlanCommand): void {
    this.#messages.push(
      new JusticePresentationPlanUpdated(this.id, command.authorId, this.buildState(command)),
    );
  }

  delete(): void {
    this.#messages.push(new JusticePresentationPlanDeleted(this.id));
  }

  present(command: { endTime: TimeOnly }): void {
    this.#messages.push(new JusticePresentationPlanPresented(this.id, command.endTime));
  }

  unPresent(): void {
    this.#messages.push(new JusticePresentationPlanUnPresented(this.id));
  }

  private buildState(
    props: CreateJusticePresentationPlanCommand | UpdateJusticePresentationPlanCommand,
  ): JusticePresentationPlanState {
    const { chairman, secretary, agendas, ...state } = props;
    this.assertsChairman(chairman);
    this.assertsSecretary(secretary);
    this.assertsAgendas(agendas);

    return {
      chairman,
      secretary,
      agendas: agendas.map((agenda) => ({
        ...agenda,
        comment: agenda.comment?.trim() || null,
      })),
      endingTime: 'endingTime' in props ? props.endingTime : null,

      ...state,
    };
  }

  private assertsChairman(user: PlanUser): asserts user is Chairman {
    if (user.duty !== 'DEPUTY_PRESIDENT' && user.duty !== 'PRESIDENT') {
      throw new UnknownPresentationPlanChairman();
    }

    const titles = new Map<Magistrat.Formation, Set<UserTitleEnum | null>>([
      [Magistrat.Formation.PARQUET, new Set(['DEPUTY_PRESIDENT_PARQUET', 'PRESIDENT_PARQUET'])],
      [Magistrat.Formation.SIEGE, new Set(['DEPUTY_PRESIDENT_SIEGE', 'PRESIDENT_SIEGE'])],
    ]);

    if (!titles.get(this.formation)?.has(user.title)) throw new UnknownPresentationPlanChairman();
  }

  private assertsSecretary(user: PlanUser): asserts user is Secretary {
    if (user.duty !== 'SECRETARY' || (user.title !== 'FIRST_SECRETARY' && user.title !== null)) {
      throw new UnknownPresentationPlanSecretary();
    }
  }

  private assertsAgendas(
    agendas: readonly {
      formation: Magistrat.Formation;
    }[],
  ): asserts agendas {
    if (agendas.length === 0) throw new EmptyAgendaList();
    if (agendas.some(({ formation }) => formation !== this.formation)) {
      throw new AgendaIsNotCompatibleWithPresentationPlan();
    }
  }

  private static extractFormation(
    agendas: readonly { formation: Magistrat.Formation }[],
  ): Magistrat.Formation {
    const allFormations = new Set(agendas.map(({ formation }) => formation));

    if (allFormations.size === 0) throw new EmptyAgendaList();
    if (allFormations.size !== 1) {
      throw new AgendaIsNotCompatibleWithPresentationPlan();
    }

    return Array.from(allFormations).at(0)!;
  }
}

type PlanUser = {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  gender: Gender;
  title: UserTitleEnum | null;
  duty: UserDutyEnum | null;
  displayTitle: string | null;
};

type Secretary = Omit<PlanUser, 'duty' | 'title'> & {
  duty: 'SECRETARY';
  title: 'FIRST_SECRETARY' | null;
};

type Chairman = Omit<PlanUser, 'duty' | 'title'> & {
  duty: 'PRESIDENT' | 'DEPUTY_PRESIDENT';
  title: 'PRESIDENT_PARQUET' | 'PRESIDENT_SIEGE' | 'DEPUTY_PRESIDENT_SIEGE' | 'DEPUTY_PRESIDENT_PARQUET';
};

export type JusticePresentationPlanState = {
  chairman: Chairman;
  secretary: Secretary;
  justiceContactId: string;
  date: DateOnly;
  time: TimeOnly;
  endingTime: TimeOnly | null;
  authorId: string;
  agendas: readonly {
    id: string;
    formation: Magistrat.Formation;
    comment: string | null;
  }[];
};

export type CreateJusticePresentationPlanCommand = {
  chairman: PlanUser;
  secretary: PlanUser;
  justiceContactId: string;
  date: DateOnly;
  time: TimeOnly;
  authorId: string;
  agendas: readonly {
    id: string;
    formation: Magistrat.Formation;
    comment: string | null;
  }[];
};

export type UpdateJusticePresentationPlanCommand = {
  authorId: string;
  chairman: PlanUser;
  secretary: PlanUser;
  justiceContactId: string;
  date: DateOnly;
  time: TimeOnly;
  endingTime: TimeOnly | null;
  agendas: readonly {
    id: string;
    formation: Magistrat.Formation;
    comment: string | null;
  }[];
};
