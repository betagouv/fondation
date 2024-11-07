import {
  Magistrat,
  NominationFile,
  rulesTuple,
  Transparency,
} from "shared-models";
import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { NominationFileSM } from "../../store/appState";
import {
  NominationFileVM,
  VMNominationFileRuleValue,
} from "../view-models/NominationFileVM";

export class NominationFileBuilderVM {
  private id: string;
  private title: string;
  private biography: string | null;
  private rulesChecked: NominationFileVM["rulesChecked"];
  private dueDate: DateOnly | null;
  private birthDate: DateOnly;
  private state: NominationFileVM["state"];
  private formation: NominationFileVM["formation"];
  private transparency: NominationFileVM["transparency"];
  private grade: NominationFileVM["grade"];
  private currentPosition: string;
  private targettedPosition: string;
  private comment: string | null;
  private rank: string;
  private observers: NominationFileVM["observers"];

  constructor() {
    this.id = "nomination-file-id";
    this.title = "John Doe";
    this.biography = "John Doe's biography";
    this.dueDate = new DateOnly(2030, 10, 30);
    this.birthDate = new DateOnly(1990, 1, 1);
    this.state = NominationFile.ReportState.NEW;
    this.formation = Magistrat.Formation.PARQUET;
    this.transparency = Transparency.MARCH_2025;
    this.grade = Magistrat.Grade.I;
    this.currentPosition = "current position";
    this.targettedPosition = "targetted position";
    this.comment = "Some comment";
    this.rank = "(3 sur une liste de 3)";
    this.observers = [
      ["observer 1"],
      ["observer 2", "VPI TJ Rennes", "(1 sur une liste de 2"],
    ];
    this.rulesChecked = rulesTuple.reduce(
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
    );
  }

  withId(id: string) {
    this.id = id;
    return this;
  }
  withTitle(title: string) {
    this.title = title;
    return this;
  }
  withBiography(biography: string | null) {
    this.biography = biography;
    return this;
  }
  withDueDate(dueDate: DateOnly | null) {
    this.dueDate = dueDate;
    return this;
  }
  withBirthDate(birthDate: DateOnly) {
    this.birthDate = birthDate;
    return this;
  }
  withState(state: NominationFileVM["state"]) {
    this.state = state;
    return this;
  }
  withFormation(formation: NominationFileVM["formation"]) {
    this.formation = formation;
    return this;
  }
  withTransparency(transparency: NominationFileVM["transparency"]) {
    this.transparency = transparency;
    return this;
  }
  withGrade(grade: NominationFileVM["grade"]) {
    this.grade = grade;
    return this;
  }
  withCurrentPosition(currentPosition: string) {
    this.currentPosition = currentPosition;
    return this;
  }
  withTargettedPosition(targettedPosition: string) {
    this.targettedPosition = targettedPosition;
    return this;
  }
  withComment(comment: string | null) {
    this.comment = comment;
    return this;
  }
  withRank(rank: string) {
    this.rank = rank;
    return this;
  }
  withObservers(observers: NominationFileVM["observers"]) {
    this.observers = observers;
    return this;
  }

  withTransferTimeChecked(transferTime: boolean) {
    this.rulesChecked.management.TRANSFER_TIME.checked = transferTime;
    return this;
  }
  withGettingFirstGradeChecked(gettingFirstGrade: boolean) {
    this.rulesChecked.management.GETTING_FIRST_GRADE.checked =
      gettingFirstGrade;
    return this;
  }
  withGettingGradeHHChecked(gettingGradeHH: boolean) {
    this.rulesChecked.management.GETTING_GRADE_HH.checked = gettingGradeHH;
    return this;
  }
  withGettingGradeInPlaceChecked(gettingGradeInPlace: boolean) {
    this.rulesChecked.management.GETTING_GRADE_IN_PLACE.checked =
      gettingGradeInPlace;
    return this;
  }
  withProfiledPositionChecked(profiledPosition: boolean) {
    this.rulesChecked.management.PROFILED_POSITION.checked = profiledPosition;
    return this;
  }
  withCassationCourtNominationChecked(cassationCourtNomination: boolean) {
    this.rulesChecked.management.CASSATION_COURT_NOMINATION.checked =
      cassationCourtNomination;
    return this;
  }
  withOverseasToOverseasChecked(overseasToOverseas: boolean) {
    this.rulesChecked.management.OVERSEAS_TO_OVERSEAS.checked =
      overseasToOverseas;
    return this;
  }
  withJudiciaryRoleAndJuridictionDegreeChangeChecked(
    judiciaryRoleAndJuridictionDegreeChange: boolean,
  ) {
    this.rulesChecked.management.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE.checked =
      judiciaryRoleAndJuridictionDegreeChange;
    return this;
  }
  withJudiciaryRoleAndJuridictionDegreeChangeInSameRessortChecked(
    judiciaryRoleAndJuridictionDegreeChangeInSameRessort: boolean,
  ) {
    this.rulesChecked.management.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT.checked =
      judiciaryRoleAndJuridictionDegreeChangeInSameRessort;
    return this;
  }
  withAllRulesChecked(checked: boolean) {
    return rulesTuple.reduce((builder, [ruleGroup, ruleName]) => {
      return builder.withRuleChecked(ruleGroup, ruleName, checked);
    }, this);
  }
  withRuleChecked(
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
    checked: boolean,
  ) {
    (
      this.rulesChecked[ruleGroup] as Record<
        NominationFile.RuleName,
        VMNominationFileRuleValue
      >
    )[ruleName].checked = checked;
    return this;
  }

  build(): NominationFileVM {
    return {
      id: this.id,
      name: this.title,
      biography: this.biography,
      dueDate: this.dueDate?.toFormattedString() ?? null,
      birthDate: this.birthDate.toFormattedString(),
      state: this.state,
      formation: this.formation,
      transparency: this.transparency,
      grade: this.grade,
      currentPosition: this.currentPosition,
      targettedPosition: this.targettedPosition,
      comment: this.comment,
      rank: this.rank,
      observers: this.observers,
      rulesChecked: this.rulesChecked,
    };
  }

  static fromStoreModel(nominationFileStoreModel: NominationFileSM) {
    return new NominationFileBuilderVM()
      .withId(nominationFileStoreModel.id)
      .withBiography(nominationFileStoreModel.biography)
      .withBirthDate(
        DateOnly.fromStoreModel(nominationFileStoreModel.birthDate),
      )
      .withComment(nominationFileStoreModel.comment)
      .withCurrentPosition(nominationFileStoreModel.currentPosition)
      .withDueDate(
        nominationFileStoreModel.dueDate
          ? DateOnly.fromStoreModel(nominationFileStoreModel.dueDate)
          : null,
      )
      .withFormation(nominationFileStoreModel.formation)
      .withGrade(nominationFileStoreModel.grade)
      .withRank(nominationFileStoreModel.rank)
      .withState(nominationFileStoreModel.state)
      .withTargettedPosition(nominationFileStoreModel.targettedPosition)
      .withTransparency(nominationFileStoreModel.transparency)
      .withObservers(
        nominationFileStoreModel.observers?.map(
          (o) => o.split("\n") as [string, ...string[]],
        ) || null,
      );
  }
}
