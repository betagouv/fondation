import {
  Magistrat,
  NominationFile,
  rulesTuple,
  Transparency,
} from "shared-models";
import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { NominationFileListItem, NominationFileSM } from "../../store/appState";
import _ from "lodash";
import { Get, Paths } from "type-fest";

type InternalNominationFile = Omit<
  NominationFileSM & NominationFileListItem,
  "dueDate" | "birthDate" | "observersCount"
> & {
  dueDate: DateOnly | null;
  birthDate: DateOnly;
};

export class NominationFileBuilder {
  private _nominationFile: InternalNominationFile;

  constructor() {
    this._nominationFile = {
      id: "nomination-file-id",
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
      rules: rulesTuple.reduce(
        (acc, [ruleGroup, ruleName]) => {
          return {
            ...acc,
            [ruleGroup]: {
              ...acc[ruleGroup],
              [ruleName]: {
                id: ruleName,
                preValidated: true,
                validated: true,
                comment: `${ruleName} comment`,
              },
            },
          };
        },
        {} as NominationFileSM["rules"],
      ),
    };
  }

  with<
    K extends Paths<InternalNominationFile>,
    V extends Get<InternalNominationFile, K> = Get<InternalNominationFile, K>,
  >(property: K, value: V) {
    if (!this._nominationFile) throw new Error("No nomination file");
    this._nominationFile = _.set(this._nominationFile, property, value);
    return this;
  }

  withTransferTimeValidated(transferTime: boolean) {
    this._nominationFile.rules.management.TRANSFER_TIME.validated =
      transferTime;
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

  buildListVM(): NominationFileListItem {
    return {
      id: this._nominationFile.id,
      folderNumber: this._nominationFile.folderNumber,
      name: this._nominationFile.name,
      reporterName: this._nominationFile.reporterName,
      dueDate: this._nominationFile.dueDate?.toStoreModel() ?? null,
      state: this._nominationFile.state,
      formation: this._nominationFile.formation,
      transparency: this._nominationFile.transparency,
      grade: this._nominationFile.grade,
      targettedPosition: this._nominationFile.targettedPosition,
      observersCount: this._nominationFile.observers?.length ?? 0,
    };
  }
  buildRetrieveVM(): NominationFileSM {
    return {
      id: this._nominationFile.id,
      folderNumber: this._nominationFile.folderNumber,
      name: this._nominationFile.name,
      biography: this._nominationFile.biography,
      dueDate: this._nominationFile.dueDate?.toStoreModel() ?? null,
      birthDate: this._nominationFile.birthDate.toStoreModel(),
      state: this._nominationFile.state,
      formation: this._nominationFile.formation,
      transparency: this._nominationFile.transparency,
      grade: this._nominationFile.grade,
      currentPosition: this._nominationFile.currentPosition,
      targettedPosition: this._nominationFile.targettedPosition,
      rank: this._nominationFile.rank,
      comment: this._nominationFile.comment,
      observers: this._nominationFile.observers,
      rules: this._nominationFile.rules,
    };
  }
}
