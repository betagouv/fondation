import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { ReportToCreate } from '../use-cases/report-creation/create-report.use-case';
import { ReportCreatedEvent } from './report-created.event';

export enum NominationFileManagementRule {
  TRANSFER_TIME = 'TRANSFER_TIME',
  GETTING_FIRST_GRADE = 'GETTING_FIRST_GRADE',
  GETTING_GRADE_HH = 'GETTING_GRADE_HH',
  GETTING_GRADE_IN_PLACE = 'GETTING_GRADE_IN_PLACE',
  PROFILED_POSITION = 'PROFILED_POSITION',
  CASSATION_COURT_NOMINATION = 'CASSATION_COURT_NOMINATION',
  OVERSEAS_TO_OVERSEAS = 'OVERSEAS_TO_OVERSEAS',
  JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE = 'JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE',
  JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT = 'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT',
}

export class NominationFileReport {
  constructor(
    readonly id: string,
    readonly createdAt: Date,
    readonly biography: string | null,
    readonly dueDate: DateOnly | null,
    readonly name: string,
    readonly reporterName: string | null,
    readonly birthDate: DateOnly,
    readonly state: NominationFile.ReportState,
    readonly formation: Magistrat.Formation,
    readonly transparency: Transparency,
    readonly grade: Magistrat.Grade,
    readonly currentPosition: string,
    readonly targettedPosition: string,
    readonly comment: string | null,
    readonly rank: string,
  ) {}

  static createFromImport(
    reportId: string,
    eventId: string,
    importedNominationFileId: string,
    createReportPayload: ReportToCreate,
    currentDate: Date,
  ): [NominationFileReport, ReportCreatedEvent] {
    const report = new NominationFileReport(
      reportId,
      currentDate,
      createReportPayload.biography,
      createReportPayload.dueDate
        ? new DateOnly(
            createReportPayload.dueDate.year,
            createReportPayload.dueDate.month,
            createReportPayload.dueDate.day,
          )
        : null,
      createReportPayload.name,
      createReportPayload.reporterName,
      new DateOnly(
        createReportPayload.birthDate.year,
        createReportPayload.birthDate.month,
        createReportPayload.birthDate.day,
      ),
      createReportPayload.state,
      createReportPayload.formation,
      createReportPayload.transparency,
      createReportPayload.grade,
      createReportPayload.currentPosition,
      createReportPayload.targettedPosition,
      null,
      createReportPayload.rank,
    );

    const reportCreatedEvent = new ReportCreatedEvent(
      eventId,
      reportId,
      importedNominationFileId,
      currentDate,
    );

    return [report, reportCreatedEvent];
  }
}
