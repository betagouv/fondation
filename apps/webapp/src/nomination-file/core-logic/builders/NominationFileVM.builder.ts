import _ from "lodash";
import {
  Magistrat,
  NominationFile,
  rulesTuple,
  Transparency,
} from "shared-models";
import { Get, Paths } from "type-fest";
import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { NominationFileSM } from "../../store/appState";
import {
  NominationFileVM,
  VMNominationFileRuleValue,
} from "../view-models/NominationFileVM";

type InternalNominationFileVM = Omit<
  NominationFileVM,
  "dueDate" | "birthDate"
> & {
  dueDate: DateOnly | null;
  birthDate: DateOnly;
};

export class NominationFileBuilderVM {
  private _nominationFileVM: InternalNominationFileVM;

  constructor() {
    this._nominationFileVM = {
      id: "nomination-file-id",

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
      rulesChecked: rulesTuple.reduce(
        (acc, [ruleGroup, ruleName]) => {
          return {
            ...acc,
            [ruleGroup]: {
              ...acc[ruleGroup],
              [ruleName]: {
                id: ruleName,
                highlighted: true,
                checked: false,
                label: (
                  NominationFileVM.rulesToLabels[ruleGroup] as Record<
                    NominationFile.RuleName,
                    string
                  >
                )[ruleName],
                comment: `${ruleName} comment`,
              },
            },
          };
        },
        {} as NominationFileVM["rulesChecked"],
      ),
    };
  }

  with<
    K extends Paths<NominationFileVM>,
    V extends Get<NominationFileVM, K> = Get<NominationFileVM, K>,
  >(property: K, value: V) {
    if (!this._nominationFileVM) throw new Error("No nomination file");
    this._nominationFileVM = _.set(this._nominationFileVM, property, value);
    return this;
  }

  withDueDate(dueDate: DateOnly | null) {
    this._nominationFileVM.dueDate = dueDate;
    return this;
  }
  withBirthDate(birthDate: DateOnly) {
    this._nominationFileVM.birthDate = birthDate;
    return this;
  }

  withAllRulesChecked(checked: boolean) {
    return rulesTuple.reduce((builder, [ruleGroup, ruleName]) => {
      return builder.withRuleChecked(ruleGroup, ruleName, checked);
    }, this);
  }

  private withRuleChecked(
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
    checked: boolean,
  ) {
    (
      this._nominationFileVM.rulesChecked[ruleGroup] as Record<
        NominationFile.RuleName,
        VMNominationFileRuleValue
      >
    )[ruleName].checked = checked;
    return this;
  }

  build(): NominationFileVM {
    return {
      ...this._nominationFileVM,
      dueDate: this._nominationFileVM.dueDate?.toFormattedString() ?? null,
      birthDate: this._nominationFileVM.birthDate.toFormattedString(),
    };
  }

  static fromStoreModel(nominationFileStoreModel: NominationFileSM) {
    return new NominationFileBuilderVM()
      .with("id", nominationFileStoreModel.id)
      .with("biography", nominationFileStoreModel.biography)
      .withBirthDate(
        DateOnly.fromStoreModel(nominationFileStoreModel.birthDate),
      )
      .with("comment", nominationFileStoreModel.comment)
      .with("currentPosition", nominationFileStoreModel.currentPosition)
      .withDueDate(
        nominationFileStoreModel.dueDate
          ? DateOnly.fromStoreModel(nominationFileStoreModel.dueDate)
          : null,
      )
      .with("formation", nominationFileStoreModel.formation)
      .with("grade", nominationFileStoreModel.grade)
      .with("rank", nominationFileStoreModel.rank)
      .with("state", nominationFileStoreModel.state)
      .with("targettedPosition", nominationFileStoreModel.targettedPosition)
      .with("transparency", nominationFileStoreModel.transparency)
      .with(
        "observers",
        nominationFileStoreModel.observers?.map(
          (o) => o.split("\n") as [string, ...string[]],
        ) || null,
      );
  }
}
