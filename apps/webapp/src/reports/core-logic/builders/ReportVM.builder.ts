import _ from "lodash";
import {
  AllRulesMapV2,
  Magistrat,
  NominationFile,
  Transparency,
} from "shared-models";
import { Get, Paths, SetOptional } from "type-fest";
import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { ReportSM } from "../../../store/appState";
import { ReportVM, VMReportRuleValue } from "../view-models/ReportVM";

type InternalReportVM<RulesMap extends AllRulesMapV2> = Omit<
  SetOptional<ReportVM<RulesMap>, "rulesChecked">,
  "dueDate"
> & {
  dueDate: DateOnly | null;
};

export class ReportBuilderVM<RulesMap extends AllRulesMapV2 = AllRulesMapV2> {
  private _reportVM: InternalReportVM<RulesMap>;

  constructor() {
    this._reportVM = {
      id: "report-id",

      name: "John Doe",
      biography: "John Doe's biography",
      dueDate: new DateOnly(2030, 10, 30),
      birthDate: "01/01/1990",
      state: NominationFile.ReportState.NEW,
      formation: Magistrat.Formation.PARQUET,
      transparency: Transparency.GRANDE_TRANSPA_DU_21_MARS_2025,
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
          name: "image.png",
          signedUrl: "https://example.com/placeholder-image.png",
        },
      ],
    };
  }

  with<
    K extends Paths<InternalReportVM<RulesMap>>,
    V extends Get<InternalReportVM<RulesMap>, K> = Get<
      InternalReportVM<RulesMap>,
      K
    >,
  >(property: K, value: V) {
    if (!this._reportVM) throw new Error("No report");
    this._reportVM = _.set(this._reportVM, property, value);
    return this;
  }

  withBirthDate(birthDate: DateOnly, currentDate: DateOnly) {
    this._reportVM.birthDate = `${birthDate.toFormattedString()} (${birthDate.getAge(currentDate)} ans)`;
    return this;
  }

  build(): ReportVM<RulesMap> {
    return {
      ...this._reportVM,
      rulesChecked: this.buildRulesChecked(),
      dueDate: this._reportVM.dueDate?.toFormattedString() ?? null,
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
    };

    // Typescript generalizes the group type to string because it's a dynamic value,
    // so we need to cast the returned type to the correct one.
    return {
      [group]: rulesGroup,
    } as Record<G, typeof rulesGroup>;
  }

  static fromStoreModel<R extends AllRulesMapV2 = AllRulesMapV2>(
    reportStoreModel: ReportSM,
    currentDate: DateOnly = DateOnly.now(),
  ): ReportBuilderVM<R> {
    return new ReportBuilderVM<R>()
      .with("id", reportStoreModel.id)
      .with("biography", reportStoreModel.biography)
      .withBirthDate(
        DateOnly.fromStoreModel(reportStoreModel.birthDate),
        currentDate,
      )
      .with("comment", reportStoreModel.comment)
      .with("currentPosition", reportStoreModel.currentPosition)
      .with(
        "dueDate",
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
      .with(
        "attachedFiles",
        reportStoreModel.attachedFiles?.map((file) => ({
          ...file,
          signedUrl: file.signedUrl,
        })) || null,
      );
  }
}
