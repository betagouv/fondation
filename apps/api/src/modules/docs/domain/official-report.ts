import { Gender, Magistrat, Role } from 'shared-models';
import { PrismaUserDutyEnum } from 'src/generated/prisma/enums';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';
import { TimeOnly } from 'src/utils/time-only';

export type OfficialReportUser = {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  role: Role;
  title: string | null;
  duty: PrismaUserDutyEnum | null;
};

export class InvalidChairmanDuty extends Error {}
export class InvalidChairmanFormation extends Error {}
export class InvalidSecretaryDuty extends Error {}

export class OfficialReportCreated {
  constructor(
    readonly id: Id<'OfficialReportId'>,
    readonly sessionMeetingDate: DateOnly,
    readonly sessionMeetingStartingTime: TimeOnly,
    readonly hasRenunciation: boolean,
    readonly justiceDepartmentContactId: number,
    readonly chairman: OfficialReportUser,
    readonly secretary: OfficialReportUser,
    readonly agendaIds: readonly string[],
    readonly members: readonly OfficialReportUser[],
    readonly authorId: string,
  ) {}
}

export type OfficialReportEvent = OfficialReportCreated;

export class OfficialReport {
  readonly #messages: OfficialReportEvent[] = [];

  private constructor(readonly id: Id<'OfficialReportId'>) {}

  get messages(): readonly OfficialReportEvent[] {
    return this.#messages;
  }

  static create(props: {
    sessionMeetingDate: DateOnly;
    sessionMeetingStartingTime: TimeOnly;
    hasRenunciation: boolean;
    justiceDepartmentContactId: number;
    chairman: OfficialReportUser;
    secretary: OfficialReportUser;
    agendaIds: readonly string[];
    members: readonly OfficialReportUser[];
    authorId: string;
    formation: Magistrat.Formation;
  }): OfficialReport {
    if (props.chairman.duty !== PrismaUserDutyEnum.PRESIDENT) {
      throw new InvalidChairmanDuty();
    }

    if (
      (props.chairman.role === Role.MEMBRE_DU_PARQUET &&
        props.formation === Magistrat.Formation.SIEGE) ||
      (props.chairman.role === Role.MEMBRE_DU_SIEGE &&
        props.formation === Magistrat.Formation.PARQUET)
    ) {
      throw new InvalidChairmanFormation();
    }

    if (props.secretary.duty !== PrismaUserDutyEnum.SECRETARY) {
      throw new InvalidSecretaryDuty();
    }

    const report = new OfficialReport(makeId('OfficialReportId'));

    report.#messages.push(
      new OfficialReportCreated(
        report.id,
        props.sessionMeetingDate,
        props.sessionMeetingStartingTime,
        props.hasRenunciation,
        props.justiceDepartmentContactId,
        props.chairman,
        props.secretary,
        props.agendaIds,
        props.members,
        props.authorId,
      ),
    );

    return report;
  }
}
