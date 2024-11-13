import _ from 'lodash';
import {
  Magistrat,
  NominationFile,
  ReportRetrievalVM,
  Transparency,
} from 'shared-models';
import { Get, Paths } from 'type-fest';
import { NominationFileReportSnapshot } from './nomination-file-report';

export class ReportRetrievalVMBuilder {
  private _viewModel: ReportRetrievalVM;

  constructor() {
    const defaultValue: NominationFile.RuleValue = {
      id: 'rule-id',
      preValidated: true,
      validated: true,
      comment: 'rule comment',
    };

    this._viewModel = {
      id: 'report-id',
      folderNumber: 1,
      name: 'Ada Lovelace',
      biography: 'The biography',
      dueDate: {
        year: 2030,
        month: 10,
        day: 5,
      },
      birthDate: {
        year: 1915,
        month: 12,
        day: 10,
      },
      state: NominationFile.ReportState.NEW,
      formation: Magistrat.Formation.PARQUET,
      transparency: Transparency.MARCH_2025,
      grade: Magistrat.Grade.I,
      currentPosition: 'current position',
      targettedPosition: 'targetted position',
      comment: 'comments',
      rank: '(2 sur une liste de 100)',
      observers: ['observer 1', 'observer 2'],
      rules: {
        [NominationFile.RuleGroup.MANAGEMENT]: {
          [NominationFile.ManagementRule.TRANSFER_TIME]: defaultValue,
          [NominationFile.ManagementRule.GETTING_FIRST_GRADE]: defaultValue,
          [NominationFile.ManagementRule.GETTING_GRADE_HH]: defaultValue,
          [NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE]: defaultValue,
          [NominationFile.ManagementRule.PROFILED_POSITION]: defaultValue,
          [NominationFile.ManagementRule.CASSATION_COURT_NOMINATION]:
            defaultValue,
          [NominationFile.ManagementRule.OVERSEAS_TO_OVERSEAS]: defaultValue,
          [NominationFile.ManagementRule
            .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE]: defaultValue,
          [NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT]:
            defaultValue,
        },
        [NominationFile.RuleGroup.STATUTORY]: {
          [NominationFile.StatutoryRule
            .JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION]: defaultValue,
          [NominationFile.StatutoryRule.GRADE_ON_SITE_AFTER_7_YEARS]:
            defaultValue,
          [NominationFile.StatutoryRule
            .MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS]: defaultValue,
          [NominationFile.StatutoryRule.MINISTER_CABINET]: defaultValue,
          [NominationFile.StatutoryRule.GRADE_REGISTRATION]: defaultValue,
          [NominationFile.StatutoryRule.HH_WITHOUT_2_FIRST_GRADE_POSITIONS]:
            defaultValue,
          [NominationFile.StatutoryRule
            .LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO]:
            defaultValue,
        },
        [NominationFile.RuleGroup.QUALITATIVE]: {
          [NominationFile.QualitativeRule
            .CONFLICT_OF_INTEREST_PRE_MAGISTRATURE]: defaultValue,
          [NominationFile.QualitativeRule
            .CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION]: defaultValue,
          [NominationFile.QualitativeRule.EVALUATIONS]: defaultValue,
          [NominationFile.QualitativeRule.DISCIPLINARY_ELEMENTS]: defaultValue,
          [NominationFile.QualitativeRule.HH_NOMINATION_CONDITIONS]:
            defaultValue,
        },
      },
    };
  }

  with<
    K extends Paths<ReportRetrievalVM>,
    V extends Get<ReportRetrievalVM, K> = Get<ReportRetrievalVM, K>,
  >(property: K, value: V) {
    this._viewModel = _.set(this._viewModel, property, value);
    return this;
  }

  build(): ReportRetrievalVM {
    return this._viewModel;
  }

  static fromWriteSnapshot(
    report: NominationFileReportSnapshot,
  ): ReportRetrievalVMBuilder {
    return new ReportRetrievalVMBuilder()
      .with('id', report.id)
      .with('name', report.name)
      .with('biography', report.biography)
      .with('dueDate', report.dueDate ? report.dueDate.toJson() : null)
      .with('birthDate', report.birthDate.toJson())
      .with('state', report.state)
      .with('formation', report.formation)
      .with('transparency', report.transparency)
      .with('grade', report.grade)
      .with('currentPosition', report.currentPosition)
      .with('targettedPosition', report.targettedPosition)
      .with('comment', report.comment)
      .with('rank', report.rank)
      .with('observers', report.observers);
  }
}
