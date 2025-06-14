import _ from "lodash";
import {
  AllRulesMapV2,
  AttachedFileVM,
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
  RulesBuilder,
  Transparency,
} from "shared-models";
import { Get, OverrideProperties, Paths, SetOptional } from "type-fest";

export type ReportApiModel = SetOptional<
  OverrideProperties<
    ReportRetrievalVM,
    {
      attachedFiles: AttachedFileVM[] | null;
    }
  >,
  "rules"
> &
  ReportListItemVM;

export class ReportApiModelBuilder {
  private _report: ReportApiModel;

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
      state: NominationFile.ReportState.IN_PROGRESS,
      formation: Magistrat.Formation.PARQUET,
      transparency: Transparency.GRANDE_TRANSPA_DU_21_MARS_2025,
      grade: Magistrat.Grade.I,
      currentPosition: "PG TJ Paris",
      targettedPosition: "PG TJ Marseille",
      rank: "(2 sur une liste de 3)",
      comment: "Some comment",
      observers: ["observer 1", "observer 2"],
      observersCount: 2,
      attachedFiles: null,
      dureeDuPoste: "3 ans et 6 mois",
      rules: new RulesFromMapBuilder(rulesMap).build(),
      dateTransparence: {
        year: 2025,
        month: 3,
        day: 21,
      },
    };
  }

  with<
    K extends Paths<ReportApiModel>,
    V extends Get<ReportApiModel, K> = Get<ReportApiModel, K>,
  >(property: K, value: V) {
    if (!this._report) throw new Error("No report");
    this._report = _.set(this._report, property, value);
    return this;
  }

  withObservers(observers: string[] | null) {
    return this.with("observers", observers).with(
      "observersCount",
      observers?.length || 0,
    );
  }

  withSomeRules() {
    return this.with("rules.management.TRANSFER_TIME", {
      id: `${NominationFile.RuleGroup.MANAGEMENT}-${NominationFile.ManagementRule.TRANSFER_TIME}`,
      validated: true,
      preValidated: false,
    })
      .with("rules.statutory.MINISTER_CABINET", {
        id: `${NominationFile.RuleGroup.STATUTORY}-${NominationFile.StatutoryRule.MINISTER_CABINET}`,
        validated: true,
        preValidated: false,
      })
      .with("rules.statutory.GRADE_REGISTRATION", {
        id: `${NominationFile.RuleGroup.STATUTORY}-${NominationFile.StatutoryRule.GRADE_REGISTRATION}`,
        validated: true,
        preValidated: false,
      })

      .with("rules.qualitative.EVALUATIONS", {
        id: `${NominationFile.RuleGroup.QUALITATIVE}-${NominationFile.QualitativeRule.EVALUATIONS}`,
        validated: true,
        preValidated: false,
      });
  }

  build(): ReportApiModel {
    return {
      ...this._report,
      rules: this.buildRules(),
    };
  }

  private buildRules() {
    return Object.values(NominationFile.RuleGroup).reduce(
      (acc, group) =>
        ({
          ...acc,
          ...this.buildRulesGroup(group),
        }) as NominationFile.Rules,
      {} as NominationFile.Rules,
    );
  }

  private buildRulesGroup<G extends NominationFile.RuleGroup>(group: G) {
    const rulesGroup: NominationFile.Rules[G] = {
      ...(this._report.rules?.[group] as NominationFile.Rules[G]),
    };

    // Typescript generalizes the group type to string because it's a dynamic value,
    // so we need to cast the returned type to the correct one.
    return {
      [group]: rulesGroup,
    } as Record<G, typeof rulesGroup>;
  }

  static fromRulesMap(rulesMap: AllRulesMapV2) {
    return new ReportApiModelBuilder(rulesMap);
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
