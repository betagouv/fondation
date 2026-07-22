import { FormationEnum } from 'src/modules/shared/formation.enum';
import { DateOnly } from 'src/utils/date-only';
import { Id } from 'src/utils/id';

export class OfficialReportAgenda {
  private constructor(
    readonly id: string,
    readonly date: DateOnly,
    readonly formation: FormationEnum,
    readonly session: { id: string; date: DateOnly },
  ) {}

  static from(props: {
    agenda: {
      id: string;
      formation: FormationEnum;
      date: DateOnly;
      officialReportId: string | null;
      session: { id: string; date: DateOnly };
    };
    ignoreOfficialReportId: Id<'OfficialReportId'>;
  }): OfficialReportAgenda {
    if (
      props.agenda.officialReportId !== null &&
      props.agenda.officialReportId !== props.ignoreOfficialReportId
    ) {
      throw new OfficialReportAgendaAlreadyReported(props.agenda.id);
    }

    return new OfficialReportAgenda(
      props.agenda.id,
      props.agenda.date,
      props.agenda.formation,
      props.agenda.session,
    );
  }
}

export class OfficialReportAgendaAlreadyReported extends Error {
  constructor(readonly agendaId: string) {
    super();
  }
}
