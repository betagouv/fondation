import { rulesTuple } from "@/shared-models";
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
              label: NominationFileVM.rulesToLabels[ruleName],
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
