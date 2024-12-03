import _ from "lodash";
import {
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
  Transparency,
} from "shared-models";
import { Get, Paths, SetOptional } from "type-fest";

export type ReportApiModel = SetOptional<ReportRetrievalVM, "rules"> &
  ReportListItemVM;

export class ReportApiModelBuilder {
  private _report: ReportApiModel;

  constructor() {
    this._report = {
      id: "report-id",
      name: "John Doe",
      reporterName: "REPORTER Name",
      folderNumber: 1,
      biography: "John Doe's biography",
      dueDate: {
        year: 2030,
        month: 10,
        day: 30,
      },
      birthDate: {
        year: 1980,
        month: 1,
        day: 1,
      },
      state: NominationFile.ReportState.NEW,
      formation: Magistrat.Formation.PARQUET,
      transparency: Transparency.MARCH_2025,
      grade: Magistrat.Grade.I,
      currentPosition: "PG TJ Paris",
      targettedPosition: "PG TJ Marseille",
      rank: "(2 sur une liste de 3)",
      comment: "Some comment",
      observers: ["observer 1", "observer 2"],
      observersCount: 2,
      attachedFiles: null,
    };
  }

  with<
    K extends Paths<ReportApiModel>,
    V extends Get<ReportApiModel, K> = Get<ReportApiModel, K>,
  >(property: K, value: V) {
    if (!this._report) throw new Error("No nomination file");
    this._report = _.set(this._report, property, value);
    return this;
  }

  withSomeRules() {
    return this.with("rules.management.TRANSFER_TIME", {
      id: `${NominationFile.RuleGroup.MANAGEMENT}-${NominationFile.ManagementRule.TRANSFER_TIME}`,
      validated: true,
      preValidated: false,
      comment: null,
    })
      .with("rules.management.CASSATION_COURT_NOMINATION", {
        id: `${NominationFile.RuleGroup.MANAGEMENT}-${NominationFile.ManagementRule.CASSATION_COURT_NOMINATION}`,
        validated: true,
        preValidated: false,
        comment: null,
      })

      .with("rules.statutory.MINISTER_CABINET", {
        id: `${NominationFile.RuleGroup.STATUTORY}-${NominationFile.StatutoryRule.MINISTER_CABINET}`,
        validated: true,
        preValidated: false,
        comment: null,
      })
      .with("rules.statutory.GRADE_REGISTRATION", {
        id: `${NominationFile.RuleGroup.STATUTORY}-${NominationFile.StatutoryRule.GRADE_REGISTRATION}`,
        validated: true,
        preValidated: false,
        comment: null,
      })

      .with("rules.qualitative.EVALUATIONS", {
        id: `${NominationFile.RuleGroup.QUALITATIVE}-${NominationFile.QualitativeRule.EVALUATIONS}`,
        validated: true,
        preValidated: false,
        comment: null,
      });
  }

  build(): ReportApiModel {
    return this._report;
  }
}
