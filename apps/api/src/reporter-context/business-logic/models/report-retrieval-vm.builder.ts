import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';
import { NominationFileManagementRule } from './nomination-file-report';
import { ReportRetrievalVM } from './report-retrieval-vm';
import { Magistrat, NominationFile, Transparency } from '@/shared-models';

export class ReportRetrievalVMBuilder {
  private id: string;
  private name: string;
  private biography: string;
  private dueDate: DateOnlyJson | null;
  private birthDate: DateOnlyJson;
  private state: NominationFile.ReportState;
  private formation: Magistrat.Formation;
  private transparency: Transparency;
  private grade: Magistrat.Grade;
  private targettedPosition: string;
  private comment: string | null;
  private rules: NominationFile.Rules;

  constructor() {
    this.id = 'report-id';
    this.name = 'Ada Lovelace';
    this.biography = 'The biography';
    this.dueDate = {
      year: 2030,
      month: 10,
      day: 5,
    };
    this.birthDate = {
      year: 1915,
      month: 12,
      day: 10,
    };
    this.state = NominationFile.ReportState.NEW;
    this.formation = Magistrat.Formation.PARQUET;
    this.transparency = Transparency.MARCH_2025;
    this.grade = Magistrat.Grade.I;
    this.targettedPosition = 'targetted position';
    this.comment = 'comments';

    const defaultValue: NominationFile.RuleValue = {
      id: 'rule-id',
      preValidated: true,
      validated: true,
      comment: 'rule comment',
    };
    this.rules = {
      [NominationFile.RuleGroup.MANAGEMENT]: {
        [NominationFileManagementRule.TRANSFER_TIME]: defaultValue,
        [NominationFileManagementRule.GETTING_FIRST_GRADE]: defaultValue,
        [NominationFileManagementRule.GETTING_GRADE_HH]: defaultValue,
        [NominationFileManagementRule.GETTING_GRADE_IN_PLACE]: defaultValue,
        [NominationFileManagementRule.PROFILED_POSITION]: defaultValue,
        [NominationFileManagementRule.CASSATION_COURT_NOMINATION]: defaultValue,
        [NominationFileManagementRule.OVERSEAS_TO_OVERSEAS]: defaultValue,
        [NominationFileManagementRule.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE]:
          defaultValue,
        [NominationFileManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT]:
          defaultValue,
      },
      [NominationFile.RuleGroup.STATUTORY]: {},
      [NominationFile.RuleGroup.QUALITATIVE]: {},
    };
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }
  withName(name: string): this {
    this.name = name;
    return this;
  }
  withBiography(biography: string) {
    this.biography = biography;
    return this;
  }
  withOverseasToOverseasRule(options: Partial<NominationFile.RuleValue>): this {
    const rule =
      this.rules.management[NominationFileManagementRule.OVERSEAS_TO_OVERSEAS];
    this.rules.management[NominationFileManagementRule.OVERSEAS_TO_OVERSEAS] = {
      ...rule,
      ...options,
    };
    return this;
  }

  build(): ReportRetrievalVM {
    return {
      id: this.id,
      name: this.name,
      dueDate: this.dueDate,
      birthDate: this.birthDate,
      biography: this.biography,
      state: this.state,
      formation: this.formation,
      transparency: this.transparency,
      grade: this.grade,
      targettedPosition: this.targettedPosition,
      comments: this.comment,
      rules: this.rules,
    };
  }
}
