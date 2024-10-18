import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';
import {
  NominationFileManagementRule,
  NominationFileReport,
} from './nomination-file-report';
import { ReportRetrievalVM } from '@/shared-models';
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
  private currentPosition: string;
  private targettedPosition: string;
  private comment: string | null;
  private rank: string;
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
    this.currentPosition = 'current position';
    this.targettedPosition = 'targetted position';
    this.comment = 'comments';
    this.rank = '(2 sur une liste de 100)';

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
      [NominationFile.RuleGroup.STATUTORY]: {
        [NominationFile.StatutoryRule
          .JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION]: defaultValue,
        [NominationFile.StatutoryRule.GRADE_ON_SITE_AFTER_7_YEARS]:
          defaultValue,
        [NominationFile.StatutoryRule.MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS]:
          defaultValue,
        [NominationFile.StatutoryRule.MINISTER_CABINET]: defaultValue,
        [NominationFile.StatutoryRule.GRADE_REGISTRATION]: defaultValue,
        [NominationFile.StatutoryRule.HH_WITHOUT_2_FIRST_GRADE_POSITIONS]:
          defaultValue,
        [NominationFile.StatutoryRule
          .LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO]:
          defaultValue,
      },
      [NominationFile.RuleGroup.QUALITATIVE]: {
        [NominationFile.QualitativeRule.CONFLICT_OF_INTEREST_PRE_MAGISTRATURE]:
          defaultValue,
        [NominationFile.QualitativeRule
          .CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION]: defaultValue,
        [NominationFile.QualitativeRule.EVALUATIONS]: defaultValue,
        [NominationFile.QualitativeRule.DISCIPLINARY_ELEMENTS]: defaultValue,
        [NominationFile.QualitativeRule.HH_NOMINATION_CONDITIONS]: defaultValue,
      },
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
  withDueDate(dueDate: DateOnlyJson | null) {
    this.dueDate = dueDate;
    return this;
  }
  withBirthDate(birthDate: DateOnlyJson) {
    this.birthDate = birthDate;
    return this;
  }
  withState(state: NominationFile.ReportState) {
    this.state = state;
    return this;
  }
  withFormation(formation: Magistrat.Formation) {
    this.formation = formation;
    return this;
  }
  withTransparency(transparency: Transparency) {
    this.transparency = transparency;
    return this;
  }
  withGrade(grade: Magistrat.Grade) {
    this.grade = grade;
    return this;
  }
  withCurrentPosition(currentPosition: string) {
    this.currentPosition = currentPosition;
    return this;
  }
  withTargettedPosition(targettedPosition: string) {
    this.targettedPosition = targettedPosition;
    return this;
  }
  withComment(comment: string | null) {
    this.comment = comment;
    return this;
  }
  withRank(rank: string) {
    this.rank = rank;
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
  withRules(rules: NominationFile.Rules): this {
    this.rules = rules;
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
      currentPosition: this.currentPosition,
      targettedPosition: this.targettedPosition,
      comment: this.comment,
      rank: this.rank,
      rules: this.rules,
    };
  }

  static fromWriteModel(
    report: NominationFileReport,
  ): ReportRetrievalVMBuilder {
    return new ReportRetrievalVMBuilder()
      .withId(report.id)
      .withName(report.name)
      .withBiography(report.biography)
      .withDueDate(report.dueDate ? report.dueDate.toJson() : null)
      .withBirthDate(report.birthDate.toJson())
      .withState(report.state)
      .withFormation(report.formation)
      .withTransparency(report.transparency)
      .withGrade(report.grade)
      .withCurrentPosition(report.currentPosition)
      .withTargettedPosition(report.targettedPosition)
      .withComment(report.comment)
      .withRank(report.rank);
  }
}
