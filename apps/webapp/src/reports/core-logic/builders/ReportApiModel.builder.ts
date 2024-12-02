import _ from "lodash";
import {
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
  RulesBuilder,
  Transparency,
} from "shared-models";
import { Get, Paths } from "type-fest";

export type ReportApiModel = ReportRetrievalVM & ReportListItemVM;

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
      rules: new AllRulesValidedBuilder().build(),
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

  withAllRulesUnvalidated() {
    this._report.rules = new AllRulesUnvalidatedBuilder().build();
    return this;
  }

  build(): ReportApiModel {
    return this._report;
  }
}

class AllRulesValidedBuilder extends RulesBuilder {
  constructor() {
    super(({ ruleGroup, ruleName }) => ({
      id: `${ruleGroup}-${ruleName}`,
      preValidated: true,
      validated: true,
      comment: `${ruleName} comment`,
    }));
  }
}

class AllRulesUnvalidatedBuilder extends RulesBuilder {
  constructor() {
    super(({ ruleGroup, ruleName }) => ({
      id: `${ruleGroup}-${ruleName}`,
      preValidated: true,
      validated: false,
      comment: `${ruleName} comment`,
    }));
  }
}
