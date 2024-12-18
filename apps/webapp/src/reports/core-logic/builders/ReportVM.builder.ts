import _ from "lodash";
import {
  AllRulesMap,
  Magistrat,
  NominationFile,
  Transparency,
} from "shared-models";
import { Get, Paths, SetOptional } from "type-fest";
import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { ReportSM } from "../../../store/appState";
import { ReportVM, VMReportRuleValue } from "../view-models/ReportVM";
import { getReportAccordionLabel } from "./ReportVMRules.builder";

type InternalReportVM<RulesMap extends AllRulesMap> = Omit<
  SetOptional<ReportVM<RulesMap>, "rulesChecked">,
  "dueDate" | "birthDate"
> & {
  dueDate: DateOnly | null;
  birthDate: DateOnly;
};

export class ReportBuilderVM<RulesMap extends AllRulesMap = AllRulesMap> {
  private _reportVM: InternalReportVM<RulesMap>;

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
    K extends Paths<ReportVM<RulesMap>>,
    V extends Get<ReportVM<RulesMap>, K> = Get<ReportVM<RulesMap>, K>,
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

  build(): ReportVM<RulesMap> {
    return {
      ...this._reportVM,
      rulesChecked: this.buildRulesChecked(),
      dueDate: this._reportVM.dueDate?.toFormattedString() ?? null,
      birthDate: this._reportVM.birthDate.toFormattedString(),
    };
  }

  private buildRulesChecked() {
    return Object.values(NominationFile.RuleGroup).reduce(
      (acc, group) =>
        ({
          ...acc,
          ...this.buildRulesCheckedForGroup(group),
        }) as ReportVM<RulesMap>["rulesChecked"],
      {} as ReportVM<RulesMap>["rulesChecked"],
    );
  }

  private buildRulesCheckedForGroup<G extends NominationFile.RuleGroup>(
    group: G,
  ) {
    const rulesChecked = this._reportVM.rulesChecked?.[group];

    const rulesGroup: ReportVM<RulesMap>["rulesChecked"][G] = {
      selected: {
        ...(rulesChecked?.selected as Record<
          RulesMap[G][number],
          VMReportRuleValue<true>
        >),
      },
      others: {
        ...(rulesChecked?.others as Record<
          RulesMap[G][number],
          VMReportRuleValue<false>
        >),
      },
      accordionLabel: getReportAccordionLabel(group),
    };

    // Typescript generalizes the group type to string because it's a dynamic value,
    // so we need to cast the returned type to the correct one.
    return {
      [group]: rulesGroup,
    } as Record<G, typeof rulesGroup>;
  }

  static fromStoreModel<R extends AllRulesMap = AllRulesMap>(
    reportStoreModel: ReportSM,
  ): ReportBuilderVM<R> {
    return new ReportBuilderVM<R>()
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
