import _ from "lodash";
import { Magistrat, NominationFile, Transparency } from "shared-models";
import { Get, Paths } from "type-fest";
import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { ReportListItem, ReportSM } from "../../store/appState";
import { ReportSMRulesBuilder } from "./ReportSMRules.builder";

type InternalReport = Omit<
  ReportSM & ReportListItem,
  "dueDate" | "birthDate" | "observersCount"
> & {
  dueDate: DateOnly | null;
  birthDate: DateOnly;
};

export class ReportBuilder {
  private _report: InternalReport;

  constructor() {
    this._report = {
      id: "report-id",
      name: "John Doe",
      reporterName: "REPORTER Name",
      folderNumber: 1,
      biography: "John Doe's biography",
      dueDate: new DateOnly(2030, 10, 30),
      birthDate: new DateOnly(1980, 1, 1),
      state: NominationFile.ReportState.NEW,
      formation: Magistrat.Formation.PARQUET,
      transparency: Transparency.MARCH_2025,
      grade: Magistrat.Grade.I,
      currentPosition: "PG TJ Paris",
      targettedPosition: "PG TJ Marseille",
      rank: "(2 sur une liste de 3)",
      comment: "Some comment",
      observers: ["observer 1", "observer 2"],
      rules: new ReportSMRulesBuilder().build(),
      attachedFiles: null,
    };
  }

  with<
    K extends Paths<InternalReport>,
    V extends Get<InternalReport, K> = Get<InternalReport, K>,
  >(property: K, value: V) {
    if (!this._report) throw new Error("No nomination file");
    this._report = _.set(this._report, property, value);
    return this;
  }

  withTransferTimeValidated(transferTime: boolean) {
    this._report.rules.management.TRANSFER_TIME.validated = transferTime;
    return this;
  }

  withAllRulesUnvalidated() {
    this.withTransferTimeValidated(false)
      .with("rules.management.GETTING_FIRST_GRADE.validated", false)
      .with("rules.management.GETTING_GRADE_HH.validated", false)
      .with("rules.management.GETTING_GRADE_IN_PLACE.validated", false)
      .with("rules.management.PROFILED_POSITION.validated", false)
      .with("rules.management.CASSATION_COURT_NOMINATION.validated", false)
      .with("rules.management.OVERSEAS_TO_OVERSEAS.validated", false)
      .with(
        "rules.management.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE.validated",
        false,
      )
      .with(
        "rules.management.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT.validated",
        false,
      )
      .with("rules.statutory.GRADE_ON_SITE_AFTER_7_YEARS.validated", false)
      .with("rules.statutory.GRADE_REGISTRATION.validated", false)
      .with(
        "rules.statutory.HH_WITHOUT_2_FIRST_GRADE_POSITIONS.validated",
        false,
      )
      .with(
        "rules.statutory.JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION.validated",
        false,
      )
      .with("rules.statutory.MINISTER_CABINET.validated", false)
      .with(
        "rules.statutory.LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO.validated",
        false,
      )
      .with(
        "rules.qualitative.CONFLICT_OF_INTEREST_PRE_MAGISTRATURE.validated",
        false,
      )
      .with(
        "rules.qualitative.CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION.validated",
        false,
      )
      .with("rules.qualitative.DISCIPLINARY_ELEMENTS.validated", false)
      .with("rules.qualitative.EVALUATIONS.validated", false)
      .with("rules.qualitative.HH_NOMINATION_CONDITIONS.validated", false);
    return this;
  }

  buildListVM(): ReportListItem {
    return {
      id: this._report.id,
      folderNumber: this._report.folderNumber,
      name: this._report.name,
      reporterName: this._report.reporterName,
      dueDate: this._report.dueDate?.toStoreModel() ?? null,
      state: this._report.state,
      formation: this._report.formation,
      transparency: this._report.transparency,
      grade: this._report.grade,
      targettedPosition: this._report.targettedPosition,
      observersCount: this._report.observers?.length ?? 0,
    };
  }
  buildRetrieveVM(): ReportSM {
    return {
      id: this._report.id,
      folderNumber: this._report.folderNumber,
      name: this._report.name,
      biography: this._report.biography,
      dueDate: this._report.dueDate?.toStoreModel() ?? null,
      birthDate: this._report.birthDate.toStoreModel(),
      state: this._report.state,
      formation: this._report.formation,
      transparency: this._report.transparency,
      grade: this._report.grade,
      currentPosition: this._report.currentPosition,
      targettedPosition: this._report.targettedPosition,
      rank: this._report.rank,
      comment: this._report.comment,
      observers: this._report.observers,
      rules: this._report.rules,
      attachedFiles: this._report.attachedFiles,
    };
  }
}
