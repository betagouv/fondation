import _ from "lodash";
import { Magistrat, NominationFile, Transparency } from "shared-models";
import { Get, Paths, SetOptional } from "type-fest";
import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { ReportSM } from "../../store/appState";
import { ReportVM } from "../view-models/ReportVM";

type InternalReportVM = Omit<
  SetOptional<ReportVM, "rulesChecked">,
  "dueDate" | "birthDate"
> & {
  dueDate: DateOnly | null;
  birthDate: DateOnly;
};

export class ReportBuilderVM {
  private _reportVM: InternalReportVM;

  constructor() {
    this._reportVM = {
      id: "report-id",

      name: "John Doe",
      biography: "John Doe's biography",
      dueDate: new DateOnly(2030, 10, 30),
      birthDate: new DateOnly(1990, 1, 1),
      state: NominationFile.ReportState.NEW,
      formation: Magistrat.Formation.PARQUET,
      transparency: Transparency.MARCH_2025,
      grade: Magistrat.Grade.I,
      currentPosition: "current position",
      targettedPosition: "targetted position",
      comment: "Some comment",
      rank: "(3 sur une liste de 3)",
      observers: [
        ["observer 1"],
        ["observer 2", "VPI TJ Rennes", "(1 sur une liste de 2"],
      ],
      attachedFiles: [
        {
          signedUrl: "https://example.fr/image.png",
          name: "image.png",
        },
      ],
    };
  }

  with<
    K extends Paths<ReportVM>,
    V extends Get<ReportVM, K> = Get<ReportVM, K>,
  >(property: K, value: V) {
    if (!this._reportVM) throw new Error("No report");
    this._reportVM = _.set(this._reportVM, property, value);
    return this;
  }

  withDueDate(dueDate: DateOnly | null) {
    this._reportVM.dueDate = dueDate;
    return this;
  }
  withBirthDate(birthDate: DateOnly) {
    this._reportVM.birthDate = birthDate;
    return this;
  }

  build(): ReportVM {
    return {
      ...this._reportVM,
      rulesChecked: this._reportVM.rulesChecked!,
      dueDate: this._reportVM.dueDate?.toFormattedString() ?? null,
      birthDate: this._reportVM.birthDate.toFormattedString(),
    };
  }

  static fromStoreModel(reportStoreModel: ReportSM) {
    return new ReportBuilderVM()
      .with("id", reportStoreModel.id)
      .with("biography", reportStoreModel.biography)
      .withBirthDate(DateOnly.fromStoreModel(reportStoreModel.birthDate))
      .with("comment", reportStoreModel.comment)
      .with("currentPosition", reportStoreModel.currentPosition)
      .withDueDate(
        reportStoreModel.dueDate
          ? DateOnly.fromStoreModel(reportStoreModel.dueDate)
          : null,
      )
      .with("formation", reportStoreModel.formation)
      .with("grade", reportStoreModel.grade)
      .with("rank", reportStoreModel.rank)
      .with("state", reportStoreModel.state)
      .with("targettedPosition", reportStoreModel.targettedPosition)
      .with("transparency", reportStoreModel.transparency)
      .with(
        "observers",
        reportStoreModel.observers?.map(
          (o) => o.split("\n") as [string, ...string[]],
        ) || null,
      )
      .with("attachedFiles", reportStoreModel.attachedFiles);
  }
}
