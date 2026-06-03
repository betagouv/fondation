import { isBefore } from 'date-fns';

import { Gender, Magistrat, Role } from 'shared-models';

import { PrismaUserDutyEnum } from 'src/generated/prisma/enums';
import { UserDutyEnum, UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';
import { TimeOnly, timeOnlyToDate } from 'src/utils/time-only';

export type OfficialReportUser = {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  role: Role;
  displayTitle: string | null;
  title: UserTitleEnum | null;
  duty: UserDutyEnum | null;
  sort: number;
};

export class ChairmanIsNotMember extends Error {}
export class InvalidChairmanFormation extends Error {}
export class InvalidSecretaryDuty extends Error {}
export class MixedFormationAgendas extends Error {}
export class MixedSessionAgendas extends Error {}
export class OfficialReportEndingTimeIsBeforeStatingTime extends Error {}
export class OfficialReportAgendaAlreadyReported extends Error {}
export class EmptyMembersList extends Error {}

export class OfficialReportCreated {
  constructor(
    readonly id: Id<'OfficialReportId'>,
    readonly sessionMeetingDate: DateOnly,
    readonly sessionMeetingStartingTime: TimeOnly,
    readonly sessionMeetingEndingTime: TimeOnly,
    readonly hasRenunciation: boolean,
    readonly justiceDepartmentContactId: string,
    readonly chairman: OfficialReportUser,
    readonly secretary: Omit<OfficialReportUser, 'sort'>,
    readonly agendaIds: readonly string[],
    readonly members: readonly {
      id: string;
      firstName: string;
      lastName: string;
      gender: Gender;
      title: string | null;
      isAbsent: boolean;
      sort: number;
    }[],
    readonly authorId: string,
  ) {}
}

export class OfficialReportDeleted {
  constructor(readonly officialReportId: Id<'OfficialReportId'>) {}
}

export class OfficialReportUpdated {
  constructor(
    readonly id: Id<'OfficialReportId'>,
    readonly sessionMeetingDate: DateOnly,
    readonly sessionMeetingStartingTime: TimeOnly,
    readonly sessionMeetingEndingTime: TimeOnly,
    readonly hasRenunciation: boolean,
    readonly justiceDepartmentContactId: string,
    readonly chairman: OfficialReportUser,
    readonly secretary: Omit<OfficialReportUser, 'sort'>,
    readonly agendaIds: readonly string[],
    readonly members: readonly {
      id: string;
      firstName: string;
      lastName: string;
      gender: Gender;
      title: string | null;
      isAbsent: boolean;
      sort: number;
    }[],
    readonly authorId: string,
  ) {}
}

export type OfficialReportEvent = OfficialReportCreated | OfficialReportUpdated | OfficialReportDeleted;

export class OfficialReport {
  readonly #messages: OfficialReportEvent[] = [];

  private constructor(
    readonly id: Id<'OfficialReportId'>,
    readonly formation: Magistrat.Formation,
  ) {}

  get messages(): readonly OfficialReportEvent[] {
    return this.#messages;
  }

  static from(props: { id: string; formation: Magistrat.Formation }) {
    return new OfficialReport(makeId('OfficialReportId', props.id), props.formation);
  }

  private buildState(props: {
    sessionMeetingDate: DateOnly;
    sessionMeetingStartingTime: TimeOnly;
    sessionMeetingEndingTime: TimeOnly;
    hasRenunciation: boolean;
    justiceDepartmentContactId: string;
    chairman: OfficialReportUser;
    secretary: Omit<OfficialReportUser, 'sort'>;
    agendas: readonly {
      id: string;
      formation: Magistrat.Formation;
      officialReportId: string | null;
      session: { id: string };
    }[];
    members: readonly OfficialReportUser[];
    absentMembers: Set<string>;
    authorId: string;
  }) {
    if (
      !isBefore(
        timeOnlyToDate(props.sessionMeetingStartingTime),
        timeOnlyToDate(props.sessionMeetingEndingTime),
      )
    ) {
      throw new OfficialReportEndingTimeIsBeforeStatingTime();
    }

    if (props.chairman.role === Role.ADMIN || props.chairman.role === Role.ADJOINT_SECRETAIRE_GENERAL) {
      throw new ChairmanIsNotMember();
    }

    if (
      (props.chairman.role === Role.MEMBRE_DU_PARQUET && this.formation === Magistrat.Formation.SIEGE) ||
      (props.chairman.role === Role.MEMBRE_DU_SIEGE && this.formation === Magistrat.Formation.PARQUET)
    ) {
      throw new InvalidChairmanFormation();
    }

    if (
      props.secretary.duty !== PrismaUserDutyEnum.SECRETARY ||
      (props.secretary.role !== Role.ADJOINT_SECRETAIRE_GENERAL && props.secretary.role !== Role.ADMIN)
    ) {
      throw new InvalidSecretaryDuty();
    }

    const allAgendasSessionIds = new Set(props.agendas.map(({ session }) => session.id));
    if (allAgendasSessionIds.size > 1) {
      throw new MixedSessionAgendas();
    }

    const allAgendaFormations = new Set(props.agendas.map(({ formation }) => formation));
    if (allAgendaFormations.size > 1) {
      throw new MixedFormationAgendas();
    }

    if (
      props.agendas.some((agenda) => agenda.officialReportId !== null && agenda.officialReportId !== this.id)
    ) {
      throw new OfficialReportAgendaAlreadyReported();
    }

    const agendaIds = Array.from(new Set(props.agendas.map(({ id }) => id)));

    const members = props.members.map(({ title: _t, role: _r, duty: _d, displayTitle, ...m }) => ({
      ...m,
      title: displayTitle,
      isAbsent: props.absentMembers.has(m.id),
    }));

    if (members.filter((m) => !m.isAbsent).length < 1) {
      throw new EmptyMembersList();
    }

    return {
      agendaIds,
      sessionMeetingDate: props.sessionMeetingDate,
      sessionMeetingStartingTime: props.sessionMeetingStartingTime,
      sessionMeetingEndingTime: props.sessionMeetingEndingTime,
      hasRenunciation: props.hasRenunciation,
      justiceDepartmentContactId: props.justiceDepartmentContactId,
      chairman: props.chairman,
      secretary: props.secretary,
      authorId: props.authorId,
      members: members,
    };
  }

  static create(props: {
    sessionMeetingDate: DateOnly;
    sessionMeetingStartingTime: TimeOnly;
    sessionMeetingEndingTime: TimeOnly;
    hasRenunciation: boolean;
    justiceDepartmentContactId: string;
    chairman: OfficialReportUser;
    secretary: Omit<OfficialReportUser, 'sort'>;
    agendas: readonly {
      id: string;
      formation: Magistrat.Formation;
      session: { id: string };
      officialReportId: string | null;
    }[];
    members: readonly OfficialReportUser[];
    absentMembers: Set<string>;
    authorId: string;
    formation: Magistrat.Formation;
  }): OfficialReport {
    const report = new OfficialReport(makeId('OfficialReportId'), props.formation);

    const state = report.buildState(props);

    report.#messages.push(
      new OfficialReportCreated(
        report.id,
        state.sessionMeetingDate,
        state.sessionMeetingStartingTime,
        state.sessionMeetingEndingTime,
        state.hasRenunciation,
        state.justiceDepartmentContactId,
        state.chairman,
        state.secretary,
        state.agendaIds,
        state.members,
        state.authorId,
      ),
    );

    return report;
  }

  update(props: {
    sessionMeetingDate: DateOnly;
    sessionMeetingStartingTime: TimeOnly;
    sessionMeetingEndingTime: TimeOnly;
    hasRenunciation: boolean;
    justiceDepartmentContactId: string;
    chairman: OfficialReportUser;
    secretary: Omit<OfficialReportUser, 'sort'>;
    agendas: readonly {
      id: string;
      formation: Magistrat.Formation;
      session: { id: string };
      officialReportId: string | null;
    }[];
    members: readonly OfficialReportUser[];
    authorId: string;
    absentMembers: Set<string>;
  }): void {
    const state = this.buildState(props);

    this.#messages.push(
      new OfficialReportUpdated(
        this.id,
        state.sessionMeetingDate,
        state.sessionMeetingStartingTime,
        state.sessionMeetingEndingTime,
        state.hasRenunciation,
        state.justiceDepartmentContactId,
        state.chairman,
        state.secretary,
        state.agendaIds,
        state.members,
        state.authorId,
      ),
    );
  }

  delete(): void {
    this.#messages.push(new OfficialReportDeleted(this.id));
  }
}
