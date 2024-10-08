import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';

export enum NominationFileRuleName {
  TRANSFER_TIME = 'TRANSFER_TIME',
  GETTING_FIRST_GRADE = 'GETTING_FIRST_GRADE',
  GETTING_GRADE_HH = 'GETTING_GRADE_HH',
  GETTING_GRADE_IN_PLACE = 'GETTING_GRADE_IN_PLACE',
  PROFILED_POSITION = 'PROFILED_POSITION',
  CASSATION_COURT_NOMINATION = 'CASSATION_COURT_NOMINATION',
  OVERSEAS_TO_OVERSEAS = 'OVERSEAS_TO_OVERSEAS',
  JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE = 'JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE',
  JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE_IN_SAME_RESSORT = 'JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE_IN_SAME_RESSORT',
}

export type NominationFileRules = Record<
  NominationFileRuleName,
  { validated: boolean }
>;

export class NominationFileReport {
  constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly dueDate: DateOnly | null,
    readonly biography: string,
    readonly managementRules: NominationFileRules,
  ) {}
}
