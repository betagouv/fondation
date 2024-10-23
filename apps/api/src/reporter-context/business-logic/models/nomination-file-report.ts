import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';

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
    readonly biography: string | null,
    readonly dueDate: DateOnly | null,
    readonly name: string,
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
}
