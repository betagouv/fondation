import { NominationFile } from "../../store/appState";

export class NominationFileBuilder {
  private id: string;
  private title: string;
  private biography: string;
  private rules: NominationFile["rules"];
  private dueDate: string | null;

  constructor() {
    this.id = "nomination-file-id";
    this.title = "John Doe";
    this.biography = "John Doe's biography";
    this.dueDate = "2030-10-30";
    this.rules = {
      management: {
        TRANSFER_TIME: true,
        GETTING_FIRST_GRADE: true,
        GETTING_GRADE_HH: true,
        GETTING_GRADE_IN_PLACE: true,
        PROFILED_POSITION: true,
        CASSATION_COURT_NOMINATION: true,
        OVERSEAS_TO_OVERSEAS: true,
        JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: true,
        JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE_IN_SAME_RESSORT: true,
      },
    };
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
  withDueDate(dueDate: string | null) {
    this.dueDate = dueDate;
    return this;
  }
  withTransferTimeValidated(transferTime: boolean) {
    this.rules.management.TRANSFER_TIME = transferTime;
    return this;
  }
  withGettingFirstGradeValidated(gettingFirstGrade: boolean) {
    this.rules.management.GETTING_FIRST_GRADE = gettingFirstGrade;
    return this;
  }
  withGettingGradeHHValidated(gettingGradeHH: boolean) {
    this.rules.management.GETTING_GRADE_HH = gettingGradeHH;
    return this;
  }
  withGettingGradeInPlaceValidated(gettingGradeInPlace: boolean) {
    this.rules.management.GETTING_GRADE_IN_PLACE = gettingGradeInPlace;
    return this;
  }
  withProfiledPositionValidated(profiledPosition: boolean) {
    this.rules.management.PROFILED_POSITION = profiledPosition;
    return this;
  }
  withCassationCourtNominationValidated(cassationCourtNomination: boolean) {
    this.rules.management.CASSATION_COURT_NOMINATION = cassationCourtNomination;
    return this;
  }
  withOverseasToOverseasValidated(overseasToOverseas: boolean) {
    this.rules.management.OVERSEAS_TO_OVERSEAS = overseasToOverseas;
    return this;
  }
  withJudiciaryRoleAndJuridictionDegreeChangeValidated(
    judiciaryRoleAndJuridictionDegreeChange: boolean
  ) {
    this.rules.management.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE =
      judiciaryRoleAndJuridictionDegreeChange;
    return this;
  }
  withJudiciaryRoleAndJuridictionDegreeChangeInSameRessortValidated(
    judiciaryRoleAndJuridictionDegreeChangeInSameRessort: boolean
  ) {
    this.rules.management.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE_IN_SAME_RESSORT =
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

  build(): NominationFile {
    return {
      id: this.id,
      title: this.title,
      biography: this.biography,
      dueDate: this.dueDate,
      rules: this.rules,
    };
  }
}
