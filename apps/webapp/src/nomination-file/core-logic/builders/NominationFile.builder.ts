import { Magistrat, NominationFile, Transparency } from "@/shared-models";
import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { NominationFileSM } from "../../store/appState";

export class NominationFileBuilder {
  private id: string;
  private title: string;
  private biography: string;
  private rules: NominationFileSM["rules"];
  private dueDate: DateOnly | null;
  private state: NominationFile.ReportState;
  private formation: Magistrat.Formation;
  private transparency: Transparency;
  private grade: Magistrat.Grade;
  private targettedPosition: string;

  constructor() {
    this.id = "nomination-file-id";
    this.title = "John Doe";
    this.biography = "John Doe's biography";
    this.dueDate = new DateOnly(2030, 10, 30);
    this.rules = {
      management: {
        TRANSFER_TIME: {
          id: "TRANSFER_TIME",
          preValidated: true,
          validated: true,
          comment: "TRANSFER_TIME comment",
        },
        GETTING_FIRST_GRADE: {
          id: "GETTING_FIRST_GRADE",
          preValidated: true,
          validated: true,
          comment: "GETTING_FIRST_GRADE comment",
        },
        GETTING_GRADE_HH: {
          id: "GETTING_GRADE_HH",
          preValidated: true,
          validated: true,
          comment: "GETTING_GRADE_HH comment",
        },
        GETTING_GRADE_IN_PLACE: {
          id: "GETTING_GRADE_IN_PLACE",
          preValidated: true,
          validated: true,
          comment: "GETTING_GRADE_IN_PLACE comment",
        },
        PROFILED_POSITION: {
          id: "PROFILED_POSITION",
          preValidated: true,
          validated: true,
          comment: "PROFILED_POSITION comment",
        },
        CASSATION_COURT_NOMINATION: {
          id: "CASSATION_COURT_NOMINATION",
          preValidated: true,
          validated: true,
          comment: "CASSATION_COURT_NOMINATION comment",
        },
        OVERSEAS_TO_OVERSEAS: {
          id: "OVERSEAS_TO_OVERSEAS",
          preValidated: true,
          validated: true,
          comment: "OVERSEAS_TO_OVERSEAS comment",
        },
        JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: {
          id: "JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE",
          preValidated: true,
          validated: true,
          comment: "JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE comment",
        },
        JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: {
          id: "JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT",
          preValidated: true,
          validated: true,
          comment: "JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT comment",
        },
      },
    };
    this.state = NominationFile.ReportState.NEW;
    this.formation = Magistrat.Formation.PARQUET;
    this.transparency = Transparency.MARCH_2025;
    this.grade = Magistrat.Grade.I;
    this.targettedPosition = "PG TJ Marseille";
  }

  withId(id: string) {
    this.id = id;
    return this;
  }
  withTitle(title: string) {
    this.title = title;
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
  withTargettedPosition(targettedPosition: string) {
    this.targettedPosition = targettedPosition;
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
      name: this.title,
      biography: this.biography,
      dueDate: this.dueDate?.toStoreModel() ?? null,
      rules: this.rules,
      state: this.state,
      formation: this.formation,
      transparency: this.transparency,
      grade: this.grade,
      targettedPosition: this.targettedPosition,
    };
  }
}
