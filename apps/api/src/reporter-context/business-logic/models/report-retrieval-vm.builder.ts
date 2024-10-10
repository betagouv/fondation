import { NominationFileRuleName } from './nomination-file-report';
import { ReportRetrievalVM } from './report-retrieval-vm';

export class ReportRetrievalVMBuilder {
  private id: string;
  private title: string;
  private biography: string;
  private dueDate: string;
  private managementRules: ReportRetrievalVM['rules']['management'];

  constructor() {
    this.id = 'report-id';
    this.title = 'Report 1';
    this.biography = 'The biography';
    this.dueDate = '2030-10-05';
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
      [NominationFileRuleName.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT]: {
        validated: true,
      },
    };
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }
  withTitle(title: string): this {
    this.title = title;
    return this;
  }
  withBiography(biography: string) {
    this.biography = biography;
    return this;
  }
  withOverseasToOverseasRuleValidated(validated: boolean): this {
    this.managementRules[NominationFileRuleName.OVERSEAS_TO_OVERSEAS] = {
      validated,
    };
    return this;
  }

  build(): ReportRetrievalVM {
    return {
      id: this.id,
      title: this.title,
      dueDate: this.dueDate,
      biography: this.biography,
      rules: {
        management: this.managementRules,
      },
    };
  }
}
