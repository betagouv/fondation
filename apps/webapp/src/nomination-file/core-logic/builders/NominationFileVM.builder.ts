import { DateOnly } from "../../../shared-kernel/core-logic/models/date-only";
import { NominationFileVM } from "../../adapters/primary/selectors/selectNominationFile";

export class NominationFileBuilderVM {
  private id: string;
  private title: string;
  private biography: string;
  private rulesChecked: NominationFileVM["rulesChecked"];
  private dueDate: DateOnly | null;

  constructor() {
    this.id = "nomination-file-id";
    this.title = "John Doe";
    this.biography = "John Doe's biography";
    this.dueDate = new DateOnly(2030, 10, 30);
    this.rulesChecked = {
      management: {
        TRANSFER_TIME: {
          id: "TRANSFER_TIME",
          highlighted: true,
          checked: false,
          comment: "TRANSFER_TIME comment",
          label: NominationFileVM.rulesToLabels.TRANSFER_TIME,
        },
        GETTING_FIRST_GRADE: {
          id: "GETTING_FIRST_GRADE",
          highlighted: true,
          checked: false,
          comment: "GETTING_FIRST_GRADE comment",
          label: NominationFileVM.rulesToLabels.GETTING_FIRST_GRADE,
        },
        GETTING_GRADE_HH: {
          id: "GETTING_GRADE_HH",
          highlighted: true,
          checked: false,
          comment: "GETTING_GRADE_HH comment",
          label: NominationFileVM.rulesToLabels.GETTING_GRADE_HH,
        },
        GETTING_GRADE_IN_PLACE: {
          id: "GETTING_GRADE_IN_PLACE",
          highlighted: true,
          checked: false,
          comment: "GETTING_GRADE_IN_PLACE comment",
          label: NominationFileVM.rulesToLabels.GETTING_GRADE_IN_PLACE,
        },
        PROFILED_POSITION: {
          id: "PROFILED_POSITION",
          highlighted: true,
          checked: false,
          comment: "PROFILED_POSITION comment",
          label: NominationFileVM.rulesToLabels.PROFILED_POSITION,
        },
        CASSATION_COURT_NOMINATION: {
          id: "CASSATION_COURT_NOMINATION",
          highlighted: true,
          checked: false,
          comment: "CASSATION_COURT_NOMINATION comment",
          label: NominationFileVM.rulesToLabels.CASSATION_COURT_NOMINATION,
        },
        OVERSEAS_TO_OVERSEAS: {
          id: "OVERSEAS_TO_OVERSEAS",
          highlighted: true,
          checked: false,
          comment: "OVERSEAS_TO_OVERSEAS comment",
          label: NominationFileVM.rulesToLabels.OVERSEAS_TO_OVERSEAS,
        },
        JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: {
          id: "JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE",
          highlighted: true,
          checked: false,
          comment: "JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE comment",
          label:
            NominationFileVM.rulesToLabels
              .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE,
        },
        JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: {
          id: "JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT",
          highlighted: true,
          checked: false,
          comment: "JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT comment",
          label:
            NominationFileVM.rulesToLabels
              .JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
        },
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
  withDueDate(dueDate: DateOnly | null) {
    this.dueDate = dueDate;
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

  build(): NominationFileVM {
    return {
      id: this.id,
      name: this.title,
      biography: this.biography,
      dueDate: this.dueDate?.toFormattedString() ?? null,
      rulesChecked: this.rulesChecked,
    };
  }
}
