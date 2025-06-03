import _ from "lodash";
import {
  AllRulesMapV2,
  Magistrat,
  NominationFile,
  ReportFileUsage,
  RulesBuilder,
  Transparency,
} from "shared-models";
import { Get, Paths, SetOptional } from "type-fest";
import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { ReportListItem, ReportSM } from "../../../store/appState";
import { ReportGateway } from "../gateways/Report.gateway";
import { ReportApiModel } from "./ReportApiModel.builder";

type InternalReport = Omit<
  SetOptional<ReportSM, "rules"> & ReportListItem,
  "dueDate" | "birthDate" | "observersCount"
> & {
  dueDate: DateOnly | null;
  birthDate: DateOnly;
};

export class ReportBuilder {
  private _report: InternalReport;

  constructor(
    rulesMap: AllRulesMapV2 = {
      [NominationFile.RuleGroup.MANAGEMENT]: [],
      [NominationFile.RuleGroup.STATUTORY]: [],
      [NominationFile.RuleGroup.QUALITATIVE]: [],
    },
  ) {
    this._report = {
      id: "report-id",
      name: "John Doe",
      folderNumber: 1,
      biography: "John Doe's biography",
      dueDate: new DateOnly(2030, 10, 30),
      birthDate: new DateOnly(1980, 1, 1),
      state: NominationFile.ReportState.NEW,
      formation: Magistrat.Formation.PARQUET,
      transparency: Transparency.GRANDE_TRANSPA_DU_21_MARS_2025,
      grade: Magistrat.Grade.I,
      currentPosition: "PG TJ Paris",
      targettedPosition: "PG TJ Marseille",
      rank: "(2 sur une liste de 3)",
      comment: "Some comment",
      observers: ["observer 1", "observer 2"],
      attachedFiles: null,
      contentScreenshots: null,
      dureeDuPoste: "3 ans et 6 mois",
      rules: new RulesFromMapBuilder(rulesMap).build(),
    };
  }

  with<
    K extends Paths<InternalReport>,
    V extends Get<InternalReport, K> = Get<InternalReport, K>,
  >(property: K, value: V) {
    this._report = _.set(this._report, property, value);
    return this;
  }

  buildListSM(): ReportListItem {
    return {
      id: this._report.id,
      folderNumber: this._report.folderNumber,
      name: this._report.name,
      dueDate: this._report.dueDate?.toStoreModel() ?? null,
      state: this._report.state,
      formation: this._report.formation,
      transparency: this._report.transparency,
      grade: this._report.grade,
      targettedPosition: this._report.targettedPosition,
      observersCount: this._report.observers?.length ?? 0,
    };
  }
  buildRetrieveSM(): Awaited<ReturnType<ReportGateway["retrieveReport"]>> {
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
      rules: this._report.rules!,
      attachedFiles: this._report.attachedFiles as Awaited<
        ReturnType<ReportGateway["retrieveReport"]>
      >["attachedFiles"],
      contentScreenshots: this._report.contentScreenshots,
      dureeDuPoste: this._report.dureeDuPoste,
    };
  }

  static fromApiModel(aValidatedReportApiModel: ReportApiModel) {
    const builder = new ReportBuilder();
    return builder
      .with("id", aValidatedReportApiModel.id)
      .with("folderNumber", aValidatedReportApiModel.folderNumber)
      .with("name", aValidatedReportApiModel.name)
      .with("biography", aValidatedReportApiModel.biography)
      .with(
        "dueDate",
        aValidatedReportApiModel.dueDate
          ? DateOnly.fromStoreModel(aValidatedReportApiModel.dueDate)
          : null,
      )
      .with(
        "birthDate",
        DateOnly.fromStoreModel(aValidatedReportApiModel.birthDate),
      )
      .with("state", aValidatedReportApiModel.state)
      .with("formation", aValidatedReportApiModel.formation)
      .with("transparency", aValidatedReportApiModel.transparency)
      .with("grade", aValidatedReportApiModel.grade)
      .with("currentPosition", aValidatedReportApiModel.currentPosition)
      .with("targettedPosition", aValidatedReportApiModel.targettedPosition)
      .with("comment", aValidatedReportApiModel.comment)
      .with("rank", aValidatedReportApiModel.rank)
      .with("observers", aValidatedReportApiModel.observers)
      .with("rules", aValidatedReportApiModel.rules)
      .with(
        "attachedFiles",
        aValidatedReportApiModel.attachedFiles
          ?.filter((file) => file.usage === ReportFileUsage.ATTACHMENT)
          ?.map((file) => ({
            name: file.name,
            fileId: file.fileId,
            signedUrl: null,
          })) ?? null,
      );
  }

  static duplicate(report: ReportListItem) {
    const builder = new ReportBuilder();
    return builder
      .with("id", `duplicated-${report.id}`)
      .with("folderNumber", report.folderNumber)
      .with("name", report.name)
      .with(
        "dueDate",
        report.dueDate ? DateOnly.fromStoreModel(report.dueDate) : null,
      )
      .with("state", report.state)
      .with("formation", report.formation)
      .with("transparency", report.transparency)
      .with("grade", report.grade)
      .with("targettedPosition", report.targettedPosition);
  }
}

class RulesFromMapBuilder extends RulesBuilder {
  constructor(rulesMap: AllRulesMapV2) {
    super(
      ({ ruleName }) => ({
        id: `${ruleName}-id`,
        validated: true,
        preValidated: true,
        comment: null,
      }),
      rulesMap,
    );
  }
}
