import _ from 'lodash';
import {
  Magistrat,
  NominationFile,
  ReportRetrievalVM,
  Transparency,
} from 'shared-models';
import { Get, Paths } from 'type-fest';
import { ReportRetrievalQueried } from '../gateways/queries/report-retrieval-vm.query';
import { NominationFileReportSnapshot } from './nomination-file-report';

export class ReportRetrievalBuilder<
  T extends ReportRetrievalVM | ReportRetrievalQueried = ReportRetrievalVM,
> {
  private _report: ReportRetrievalVM & ReportRetrievalQueried;

  constructor(idMode: 'fake' | 'uuid' = 'fake') {
    const isFakeId = idMode === 'fake';
    const defaultValue: NominationFile.RuleValue = {
      id: 'rule-id',
      preValidated: true,
      validated: true,
    };

    this._report = {
      id: isFakeId ? 'report-id' : 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
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
      transparency: Transparency.GRANDE_TRANSPA_DU_21_MARS_2025,
      grade: Magistrat.Grade.I,
      currentPosition: 'current position',
      targettedPosition: 'targetted position',
      comment: 'comments',
      rank: '(2 sur une liste de 100)',
      observers: ['observer 1', 'observer 2'],
      rules: {
        [NominationFile.RuleGroup.MANAGEMENT]: {
          [NominationFile.ManagementRule.TRANSFER_TIME]: defaultValue,
          [NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE]: defaultValue,
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
          [NominationFile.StatutoryRule
            .RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS]:
            defaultValue,
          [NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS]:
            defaultValue,
        },
        [NominationFile.RuleGroup.QUALITATIVE]: {
          [NominationFile.QualitativeRule
            .CONFLICT_OF_INTEREST_PRE_MAGISTRATURE]: defaultValue,
          [NominationFile.QualitativeRule
            .CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION]: defaultValue,
          [NominationFile.QualitativeRule.EVALUATIONS]: defaultValue,
          [NominationFile.QualitativeRule.DISCIPLINARY_ELEMENTS]: defaultValue,
        },
      },
      attachedFiles: null,
      files: [],
    };
  }

  with<K extends Paths<T>, V extends Get<T, K> = Get<T, K>>(
    property: K,
    value: V,
  ) {
    this._report = _.set(this._report, property, value);
    return this;
  }

  buildVM(): T extends ReportRetrievalVM ? ReportRetrievalVM : unknown {
    const report = this._report;
    return {
      id: report.id,
      folderNumber: report.folderNumber,
      biography: report.biography,
      dueDate: report.dueDate,
      name: report.name,
      birthDate: report.birthDate,
      state: report.state,
      formation: report.formation,
      transparency: report.transparency,
      grade: report.grade,
      currentPosition: report.currentPosition,
      targettedPosition: report.targettedPosition,
      comment: report.comment,
      rank: report.rank,
      observers: report.observers,
      rules: report.rules,
      attachedFiles: report.attachedFiles,
    };
  }

  buildQueried(): T extends ReportRetrievalQueried
    ? ReportRetrievalQueried
    : unknown {
    const report = this._report;
    return {
      id: report.id,
      folderNumber: report.folderNumber,
      biography: report.biography,
      dueDate: report.dueDate,
      name: report.name,
      birthDate: report.birthDate,
      state: report.state,
      formation: report.formation,
      transparency: report.transparency,
      grade: report.grade,
      currentPosition: report.currentPosition,
      targettedPosition: report.targettedPosition,
      comment: report.comment,
      rank: report.rank,
      observers: report.observers,
      rules: report.rules,
      files: report.files?.length ? report.files : null,
    };
  }

  static fromQueriedToVM(
    report: ReportRetrievalQueried,
  ): ReportRetrievalBuilder {
    return new ReportRetrievalBuilder()
      .with('id', report.id)
      .with('folderNumber', report.folderNumber)
      .with('biography', report.biography)
      .with('dueDate', report.dueDate)
      .with('name', report.name)
      .with('birthDate', report.birthDate)
      .with('state', report.state)
      .with('formation', report.formation)
      .with('transparency', report.transparency)
      .with('grade', report.grade)
      .with('currentPosition', report.currentPosition)
      .with('targettedPosition', report.targettedPosition)
      .with('comment', report.comment)
      .with('rank', report.rank)
      .with('observers', report.observers)
      .with('rules', report.rules);
  }

  static fromWriteSnapshot<
    D extends ReportRetrievalVM | ReportRetrievalQueried = ReportRetrievalVM,
  >(report: NominationFileReportSnapshot): ReportRetrievalBuilder<D> {
    return new ReportRetrievalBuilder<
      ReportRetrievalVM | ReportRetrievalQueried
    >()
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
