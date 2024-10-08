import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import {
  NominationFileReport,
  NominationFileRuleName,
} from './nomination-file-report';

export class ReportBuilder {
  private id: string;
  private firstName: string;
  private lastName: string;
  private biography: string;
  private dueDate: DateOnly | null;
  private managementRules: NominationFileReport['managementRules'];

  constructor() {
    this.id = 'report-id';
    this.firstName = 'John';
    this.lastName = 'Doe';
    this.biography = 'Biography';
    this.dueDate = new DateOnly(2030, 1, 1);
    this.managementRules = {
      [NominationFileRuleName.TRANSFER_TIME]: { validated: true },
      [NominationFileRuleName.GETTING_FIRST_GRADE]: { validated: true },
      [NominationFileRuleName.GETTING_GRADE_HH]: { validated: true },
      [NominationFileRuleName.GETTING_GRADE_IN_PLACE]: { validated: true },
      [NominationFileRuleName.PROFILED_POSITION]: { validated: true },
      [NominationFileRuleName.CASSATION_COURT_NOMINATION]: { validated: true },
      [NominationFileRuleName.OVERSEAS_TO_OVERSEAS]: { validated: true },
      [NominationFileRuleName.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE]: {
        validated: true,
      },
      [NominationFileRuleName.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE_IN_SAME_RESSORT]:
        { validated: true },
    };
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }
  withOverseasToOverseasRuleValidated(validated: boolean): this {
    this.managementRules[NominationFileRuleName.OVERSEAS_TO_OVERSEAS] = {
      validated,
    };
    return this;
  }

  build(): NominationFileReport {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      biography: this.biography,
      dueDate: this.dueDate,
      managementRules: this.managementRules,
    };
  }
}
