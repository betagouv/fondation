import { UserDutyEnum, UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';
import { assertIsDefined } from 'src/utils/is-defined';
import { TimeOnly } from 'src/utils/time-only';

import { JusticePresentationPlanContent } from './justice-presentation-plan-content';
import {
  JusticePresentationPlanSettings,
  type PlainJusticePresentationPlanSettings,
} from './justice-presentation-plan-settings';

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
    readonly presenterId: string,
  ) {}
}

export class JusticePresentationPlanUnPresented {
  constructor(readonly id: Id<'JusticePresentationPlanId'>) {}
}

export class JusticePresentationPlanContentChecked {
  constructor(
    readonly id: Id<'JusticePresentationPlanId'>,
    readonly outdated: boolean,
  ) {}
}

export class JusticePresentationPlanAgendaRemoved {
  constructor(
    readonly id: Id<'JusticePresentationPlanId'>,
    readonly agendaId: string,
    readonly takenByPlanId: string,
    readonly removerId: string,
  ) {}
}

export type JusticePresentationPlanMessage =
  | JusticePresentationPlanCreated
  | JusticePresentationPlanUpdated
  | JusticePresentationPlanDeleted
  | JusticePresentationPlanPresented
  | JusticePresentationPlanUnPresented
  | JusticePresentationPlanContentChecked
  | JusticePresentationPlanAgendaRemoved;

export class UnknownPresentationPlanSecretary extends Error {}
export class UnknownPresentationPlanChairman extends Error {}
export class AgendaIsNotCompatibleWithPresentationPlan extends Error {}
export class EmptyAgendaList extends Error {}
export class JusticePresentationPlanEndTimeShouldBeBeforeStartTime extends Error {}
export class PresentationPlanAgendaAlreadyReported extends Error {}
export class EmptyPresentationPlanMemberList extends Error {}
export class JusticePresentationPlanNotValidated extends Error {}
export class JusticePresentationPlanAlreadyPresented extends Error {}
export class JusticePresentationPlanNotPresented extends Error {}
export class JusticePresentationPlanAlreadyValidated extends Error {}
export class JusticePresentationPlanChangedWhileValidated extends Error {}

export class JusticePresentationPlan {
  readonly #messages: JusticePresentationPlanMessage[] = [];
  get chairmanId(): string | null {
    return this.settings?.chairmanId ?? null;
  }

  get messages(): readonly JusticePresentationPlanMessage[] {
    return this.#messages;
  }

  private constructor(
    readonly id: Id<'JusticePresentationPlanId'>,
    readonly formation: FormationEnum,
    readonly startTime: TimeOnly,
    readonly agendaIds: readonly string[] = [],
    private readonly isValidated: boolean = false,
    private readonly isPresented: boolean = false,
    private readonly outdated: boolean = false,
    private readonly content?: JusticePresentationPlanContent,
    private readonly settings?: JusticePresentationPlanSettings,
  ) {}

  static from(props: {
    agendaIds: readonly string[];
    content: JusticePresentationPlanContent;
    formation: FormationEnum;
    id: string;
    isPresented: boolean;
    isValidated: boolean;
    outdated: boolean;
    settings: JusticePresentationPlanSettings;
    startTime: TimeOnly;
  }): JusticePresentationPlan {
    return new JusticePresentationPlan(
      makeId('JusticePresentationPlanId', props.id),
      props.formation,
      props.startTime,
      props.agendaIds,
      props.isValidated,
      props.isPresented,
      props.outdated,
      props.content,
      props.settings,
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

  /** the presented notice is the one the DSJ received: rewriting it would drop the pdf that left */
  update(command: UpdateJusticePresentationPlanCommand): void {
    if (this.isPresented) throw new JusticePresentationPlanAlreadyPresented();

    const settings = assertIsDefined(this.settings, 'unknown presentation plan settings');
    const state = this.buildState({
      ...command,
      members: keepingRecorded(command.members, settings.members),
    });
    // saving is how an outdated notice catches up with its agendas, so it is written again even unchanged
    if (!this.outdated && settings.equals(JusticePresentationPlanSettings.from(this.settingsOf(state)))) {
      return;
    }

    this.#messages.push(new JusticePresentationPlanUpdated(this.id, command.authorId, state));
  }

  private settingsOf(state: JusticePresentationPlanState): PlainJusticePresentationPlanSettings {
    return {
      agendas: state.agendas.map(({ comment, id }) => ({ comment, id })),
      chairmanId: state.chairman.id,
      date: state.date,
      hasRenunciation: state.hasRenunciation,
      justiceContactId: state.justiceContactId,
      members: state.members,
      secretaryId: state.secretary.id,
      time: state.time,
    };
  }

  delete(): void {
    this.#messages.push(new JusticePresentationPlanDeleted(this.id));
  }

  present(command: { endTime: TimeOnly; presenterId: string }): void {
    if (!this.isValidated) throw new JusticePresentationPlanNotValidated();
    if (this.isPresented) throw new JusticePresentationPlanAlreadyPresented();

    this.#messages.push(new JusticePresentationPlanPresented(this.id, command.endTime, command.presenterId));
  }

  /** another notice validated with these agendas takes them for good, a draft can only give them up */
  removeAgendas(command: { agendaIds: readonly string[]; takenByPlanId: string; removerId: string }): void {
    if (this.isValidated) throw new JusticePresentationPlanAlreadyValidated();

    const removed = this.agendaIds.filter((id) => command.agendaIds.includes(id));
    if (removed.length === 0) return;
    if (removed.length === this.agendaIds.length) return this.delete();

    for (const agendaId of removed) {
      this.#messages.push(
        new JusticePresentationPlanAgendaRemoved(this.id, agendaId, command.takenByPlanId, command.removerId),
      );
    }
  }

  unPresent(): void {
    if (!this.isPresented) throw new JusticePresentationPlanNotPresented();

    this.#messages.push(new JusticePresentationPlanUnPresented(this.id));
  }

  /** the notice holds no draft and no version: all it can do is say it no longer matches the agendas */
  checkContent(command: { current: JusticePresentationPlanContent }): void {
    const content = assertIsDefined(this.content, 'unknown presentation plan content');
    const outdated = content.differsFrom(command.current);
    if (outdated === this.outdated) return;

    this.#messages.push(new JusticePresentationPlanContentChecked(this.id, outdated));
  }

  private buildState(
    props: CreateJusticePresentationPlanCommand | UpdateJusticePresentationPlanCommand,
  ): JusticePresentationPlanState {
    const { agendas, chairman, members, secretary, ...state } = props;
    this.assertsChairman(chairman);
    this.assertsSecretary(secretary);
    this.assertsAgendas(agendas);
    const membersList = this.assertsMemberList(members, chairman);

    return {
      agendas: agendas.map((agenda) => ({
        ...agenda,
        comment: agenda.comment?.trim() || null,
      })),
      chairman,
      members: membersList,
      secretary,
      ...state,
    };
  }

  private assertsChairman(user: PlanUser): asserts user is Chairman {
    if (user.role === 'MEMBRE_COMMUN') return;

    if (this.formation === 'PARQUET' && user.role !== 'MEMBRE_DU_PARQUET') {
      throw new UnknownPresentationPlanChairman();
    }

    if (this.formation === 'SIEGE' && user.role !== 'MEMBRE_DU_SIEGE') {
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
  role: RoleEnum;
  gender: GenderEnum;
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

/** a member recorded for the meeting stays once no longer offered (deactivated since, or moved to another formation) */
function keepingRecorded(
  offered: readonly { id: string; isAbsent: boolean }[],
  recorded: readonly { id: string; isAbsent: boolean }[],
): { id: string; isAbsent: boolean }[] {
  const offeredIds = new Set(offered.map(({ id }) => id));
  return [...offered, ...recorded.filter(({ id }) => !offeredIds.has(id))];
}
