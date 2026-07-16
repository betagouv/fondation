import { Gender, Role } from 'shared-models';

import { UserDutyEnum, UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';
import { TimeOnly } from 'src/utils/time-only';

export class JusticePresentationPlanCreated {
  constructor(
    readonly id: Id<'JusticePresentationPlanId'>,
    readonly authorId: string,
    readonly formation: FormationEnum,
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
export class PresentationPlanAgendaAlreadyReported extends Error {}
export class EmptyPresentationPlanMemberList extends Error {}

export class JusticePresentationPlan {
  readonly #messages: JusticePresentationPlanMessage[] = [];
  get messages(): readonly JusticePresentationPlanMessage[] {
    return this.#messages;
  }

  private constructor(
    readonly id: Id<'JusticePresentationPlanId'>,
    readonly formation: FormationEnum,
    readonly startTime: TimeOnly,
  ) {}

  static from(props: { id: string; formation: FormationEnum; startTime: TimeOnly }): JusticePresentationPlan {
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
    const { chairman, secretary, agendas, members, ...state } = props;
    this.assertsChairman(chairman);
    this.assertsSecretary(secretary);
    this.assertsAgendas(agendas);
    const membersList = this.assertsMemberList(members, chairman);

    return {
      chairman,
      secretary,
      members: membersList,
      agendas: agendas.map((agenda) => ({
        ...agenda,
        comment: agenda.comment?.trim() || null,
      })),
      endingTime: 'endingTime' in props ? props.endingTime : null,

      ...state,
    };
  }

  private assertsChairman(user: PlanUser): asserts user is Chairman {
    if (user.role === Role.MEMBRE_COMMUN) return;

    if (this.formation === 'PARQUET' && user.role !== Role.MEMBRE_DU_PARQUET) {
      throw new UnknownPresentationPlanChairman();
    }

    if (this.formation === 'SIEGE' && user.role !== Role.MEMBRE_DU_SIEGE) {
      throw new UnknownPresentationPlanChairman();
    }
  }

  private assertsSecretary(user: PlanUser): asserts user is Secretary {
    if (user.duty !== 'SECRETARY' || (user.title !== 'FIRST_SECRETARY' && user.title !== null)) {
      throw new UnknownPresentationPlanSecretary();
    }
  }

  private assertsAgendas(
    agendas: readonly {
      presentationPlan: { id: string } | null;
      formation: FormationEnum;
    }[],
  ): asserts agendas {
    if (agendas.length === 0) throw new EmptyAgendaList();

    if (agendas.some(({ formation }) => formation !== this.formation)) {
      throw new AgendaIsNotCompatibleWithPresentationPlan();
    }

    if (agendas.some(({ presentationPlan }) => presentationPlan?.id && presentationPlan.id !== this.id)) {
      throw new PresentationPlanAgendaAlreadyReported();
    }
  }

  private assertsMemberList(
    members: readonly { id: string; isAbsent: boolean }[],
    chairman: { id: string },
  ): { id: string; isAbsent: boolean }[] {
    const allMembers = members.filter((m) => m.id !== chairman.id);

    const presentMembers = allMembers.filter((m) => !m.isAbsent);
    if (presentMembers.length < 1) throw new EmptyPresentationPlanMemberList();

    return allMembers;
  }

  private static extractFormation(agendas: readonly { formation: FormationEnum }[]): FormationEnum {
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
  hasRenunciation: boolean;
  agendas: readonly {
    id: string;
    formation: FormationEnum;
    comment: string | null;
  }[];
  members: readonly { id: string; isAbsent: boolean }[];
};

export type CreateJusticePresentationPlanCommand = {
  chairman: PlanUser;
  secretary: PlanUser;
  justiceContactId: string;
  date: DateOnly;
  time: TimeOnly;
  authorId: string;
  hasRenunciation: boolean;
  agendas: readonly {
    id: string;
    formation: FormationEnum;
    comment: string | null;
    session: { id: string; name: string };
    presentationPlan: { id: string } | null;
  }[];
  members: readonly { id: string; isAbsent: boolean }[];
};

export type UpdateJusticePresentationPlanCommand = {
  authorId: string;
  chairman: PlanUser;
  secretary: PlanUser;
  justiceContactId: string;
  date: DateOnly;
  time: TimeOnly;
  endingTime: TimeOnly | null;
  hasRenunciation: boolean;
  agendas: readonly {
    id: string;
    formation: FormationEnum;
    comment: string | null;
    session: { id: string; name: string };
    presentationPlan: { id: string } | null;
  }[];
  members: readonly { id: string; isAbsent: boolean }[];
};
