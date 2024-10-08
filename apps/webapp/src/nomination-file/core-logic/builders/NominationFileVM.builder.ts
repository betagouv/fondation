import { NominationFileVM } from "../../adapters/primary/selectors/selectNominationFile";
import { NominationFile } from "../../store/appState";

export class NominationFileBuilderVM {
  private id: string;
  private title: string;
  private biography: string;
  private rules: NominationFile["rules"];
  private dueDate: string | null;

  constructor() {
    this.id = "nomination-file-id";
    this.title = "John Doe";
    this.biography = "John Doe's biography";
    this.dueDate = null;
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

  build(): NominationFileVM {
    return {
      id: this.id,
      name: this.title,
      biography: this.biography,
      rulesChecked: {
        management: {
          TRANSFER_TIME: {
            checked: !this.rules.management.TRANSFER_TIME,
            label: NominationFileVM.rulesToLabels["TRANSFER_TIME"],
          },
          GETTING_FIRST_GRADE: {
            checked: !this.rules.management.GETTING_FIRST_GRADE,
            label: NominationFileVM.rulesToLabels["GETTING_FIRST_GRADE"],
          },
          GETTING_GRADE_HH: {
            checked: !this.rules.management.GETTING_GRADE_HH,
            label: NominationFileVM.rulesToLabels["GETTING_GRADE_HH"],
          },
          GETTING_GRADE_IN_PLACE: {
            checked: !this.rules.management.GETTING_GRADE_IN_PLACE,
            label: NominationFileVM.rulesToLabels["GETTING_GRADE_IN_PLACE"],
          },
          PROFILED_POSITION: {
            checked: !this.rules.management.PROFILED_POSITION,
            label: NominationFileVM.rulesToLabels["PROFILED_POSITION"],
          },
          CASSATION_COURT_NOMINATION: {
            checked: !this.rules.management.CASSATION_COURT_NOMINATION,
            label: NominationFileVM.rulesToLabels["CASSATION_COURT_NOMINATION"],
          },
          OVERSEAS_TO_OVERSEAS: {
            checked: !this.rules.management.OVERSEAS_TO_OVERSEAS,
            label: NominationFileVM.rulesToLabels["OVERSEAS_TO_OVERSEAS"],
          },
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: {
            checked:
              !this.rules.management
                .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE,
            label:
              NominationFileVM.rulesToLabels[
                "JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE"
              ],
          },
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE_IN_SAME_RESSORT: {
            checked:
              !this.rules.management
                .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE_IN_SAME_RESSORT,
            label:
              NominationFileVM.rulesToLabels[
                "JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE_IN_SAME_RESSORT"
              ],
          },
        },
      },
    };
  }
}
