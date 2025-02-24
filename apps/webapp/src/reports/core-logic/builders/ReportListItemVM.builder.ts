import _ from "lodash";
import { Magistrat } from "shared-models";
import { Get, Paths } from "type-fest";
import { ReportListItem } from "../../../store/appState";
import {
  formationToLabel,
  transparencyToLabel,
} from "../../adapters/primary/labels/labels-mappers";
import { stateToLabel } from "../../adapters/primary/labels/state-label.mapper";
import { ReportListItemVM } from "../../adapters/primary/selectors/selectReportList";

type InternalReportListItemVM = Omit<ReportListItemVM, "onClick">;

export class ReportListItemVMBuilder {
  private _report: InternalReportListItemVM;

  constructor() {
    this._report = {
      id: "report-id",
      folderNumber: 1,
      name: "John Doe",
      dueDate: "30/10/2030",
      state: "Nouveau",
      formation: "Parquet",
      transparency: "T 21/01/2025 (cabinet GDS)",
      grade: Magistrat.Grade.I,
      targettedPosition: "PG TJ Marseille",
      observersCount: 0,
      href: "",
    };
  }

  with<
    K extends Paths<InternalReportListItemVM>,
    V extends Get<InternalReportListItemVM, K> = Get<
      InternalReportListItemVM,
      K
    >,
  >(property: K, value: V) {
    this._report = _.set(this._report, property, value);
    return this;
  }

  buildSerializable(): InternalReportListItemVM {
    return this._report;
  }

  static fromStoreModel(report: ReportListItem): ReportListItemVMBuilder {
    const builder = new ReportListItemVMBuilder();

    return builder
      .with("id", report.id)
      .with("folderNumber", report.folderNumber || "Profilé")
      .with("name", report.name)
      .with("state", stateToLabel(report.state))
      .with("formation", formationToLabel(report.formation))
      .with("transparency", transparencyToLabel(report.transparency))
      .with("grade", report.grade)
      .with("targettedPosition", report.targettedPosition)
      .with("observersCount", report.observersCount)
      .with(
        "href",
        `/transparences/${report.transparency}/dossiers-de-nomination/${report.id}`,
      );
  }
}
