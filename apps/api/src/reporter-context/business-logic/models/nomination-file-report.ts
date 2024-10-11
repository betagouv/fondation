import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { Formation } from './enums/formation.enum';
import { ReportState } from './enums/report-state.enum';
import { Grade } from './enums/grade.enum';
import { Transparency } from './enums/transparency.enum';

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
    readonly biography: string,
    readonly dueDate: DateOnly | null,
    readonly name: string,
    readonly birthDate: DateOnly,
    readonly state: ReportState,
    readonly formation: Formation,
    readonly transparency: Transparency,
    readonly grade: Grade,
    readonly targettedPosition: string,
    readonly comments: string | null,
  ) {}
}
