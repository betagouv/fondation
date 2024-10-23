import {
  Magistrat,
  NominationFile,
  rulesTuple,
  Transparency,
} from "shared-models";
import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { NominationFileSM } from "../../store/appState";

export class NominationFileBuilder {
  private id: string;
  private name: string;
  private biography: string;
  private rules: NominationFileSM["rules"];
  private dueDate: DateOnly | null;
  private birthDate: DateOnly;
  private state: NominationFile.ReportState;
  private formation: Magistrat.Formation;
  private transparency: Transparency;
  private grade: Magistrat.Grade;
  private currentPosition: string;
  private targettedPosition: string;
  private rank: string;
  private comment: string | null;

  constructor() {
    this.id = "nomination-file-id";
    this.name = "John Doe";
    this.biography = "John Doe's biography";
    this.dueDate = new DateOnly(2030, 10, 30);
    this.birthDate = new DateOnly(1980, 1, 1);
    this.rules = rulesTuple.reduce(
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
    );

    this.state = NominationFile.ReportState.NEW;
    this.formation = Magistrat.Formation.PARQUET;
    this.transparency = Transparency.MARCH_2025;
    this.grade = Magistrat.Grade.I;
    this.currentPosition = "PG TJ Paris";
    this.targettedPosition = "PG TJ Marseille";
    this.rank = "(2 sur une liste de 3)";
    this.comment = "Some comment";
  }

  withId(id: string) {
    this.id = id;
    return this;
  }
  withName(name: string) {
    this.name = name;
    return this;
  }
  withBiography(biography: string) {
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
  withState(state: NominationFile.ReportState) {
    this.state = state;
    return this;
  }
  withFormation(formation: Magistrat.Formation) {
    this.formation = formation;
    return this;
  }
  withTransparency(transparency: Transparency) {
    this.transparency = transparency;
    return this;
  }
  withGrade(grade: Magistrat.Grade) {
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

  withTransferTimeValidated(transferTime: boolean) {
    this.rules.management.TRANSFER_TIME.validated = transferTime;
    return this;
  }
  withGettingFirstGradeValidated(gettingFirstGrade: boolean) {
    this.rules.management.GETTING_FIRST_GRADE.validated = gettingFirstGrade;
    return this;
  }
  withGettingGradeHHValidated(gettingGradeHH: boolean) {
    this.rules.management.GETTING_GRADE_HH.validated = gettingGradeHH;
    return this;
  }
  withGettingGradeInPlaceValidated(gettingGradeInPlace: boolean) {
    this.rules.management.GETTING_GRADE_IN_PLACE.validated =
      gettingGradeInPlace;
    return this;
  }
  withProfiledPositionValidated(profiledPosition: boolean) {
    this.rules.management.PROFILED_POSITION.validated = profiledPosition;
    return this;
  }
  withCassationCourtNominationValidated(cassationCourtNomination: boolean) {
    this.rules.management.CASSATION_COURT_NOMINATION.validated =
      cassationCourtNomination;
    return this;
  }
  withOverseasToOverseasValidated(overseasToOverseas: boolean) {
    this.rules.management.OVERSEAS_TO_OVERSEAS.validated = overseasToOverseas;
    return this;
  }
  withJudiciaryRoleAndJuridictionDegreeChangeValidated(
    judiciaryRoleAndJuridictionDegreeChange: boolean,
  ) {
    this.rules.management.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE.validated =
      judiciaryRoleAndJuridictionDegreeChange;
    return this;
  }
  withJudiciaryRoleAndJuridictionDegreeChangeInSameRessortValidated(
    judiciaryRoleAndJuridictionDegreeChangeInSameRessort: boolean,
  ) {
    this.rules.management.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT.validated =
      judiciaryRoleAndJuridictionDegreeChangeInSameRessort;
    return this;
  }

  withAllRulesUnvalidated() {
    this.withTransferTimeValidated(false)
      .withGettingFirstGradeValidated(false)
      .withGettingGradeHHValidated(false)
      .withGettingGradeInPlaceValidated(false)
      .withProfiledPositionValidated(false)
      .withCassationCourtNominationValidated(false)
      .withOverseasToOverseasValidated(false)
      .withJudiciaryRoleAndJuridictionDegreeChangeValidated(false)
      .withJudiciaryRoleAndJuridictionDegreeChangeInSameRessortValidated(false);
    return this;
  }

  build(): NominationFileSM {
    return {
      id: this.id,
      name: this.name,
      biography: this.biography,
      dueDate: this.dueDate?.toStoreModel() ?? null,
      birthDate: this.birthDate.toStoreModel(),
      state: this.state,
      formation: this.formation,
      transparency: this.transparency,
      grade: this.grade,
      currentPosition: this.currentPosition,
      targettedPosition: this.targettedPosition,
      rank: this.rank,
      comment: this.comment,

      rules: this.rules,
    };
  }
}
