import { NominationCase, RuleGroup, RuleName } from "../../store/appState";

export class NominationCaseBuilder {
  private id: string;
  private name: string;
  private biography: string;
  private preValidatedRules: NominationCase["preValidatedRules"];

  constructor() {
    this.id = "nomination-case-id";
    this.name = "John Doe";
    this.biography = "John Doe's biography";
    this.preValidatedRules = {
      managementRules: {
        transferTime: true,
        gettingFirstGrade: true,
        gettingGradeHH: true,
        gettingGradeInPlace: true,
        profiledPosition: true,
        cassationCourtNomination: true,
        overseasToOverseas: true,
        judiciaryRoleAndJuridictionDegreeChange: true,
        judiciaryRoleAndJuridictionDegreeChangeInSameRessort: true,
      },
    };
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
  withTransferTimeValidated(transferTime: boolean) {
    this.preValidatedRules.managementRules.transferTime = transferTime;
    return this;
  }
  withGettingFirstGradeValidated(gettingFirstGrade: boolean) {
    this.preValidatedRules.managementRules.gettingFirstGrade =
      gettingFirstGrade;
    return this;
  }
  withGettingGradeHHValidated(gettingGradeHH: boolean) {
    this.preValidatedRules.managementRules.gettingGradeHH = gettingGradeHH;
    return this;
  }
  withGettingGradeInPlaceValidated(gettingGradeInPlace: boolean) {
    this.preValidatedRules.managementRules.gettingGradeInPlace =
      gettingGradeInPlace;
    return this;
  }
  withProfiledPositionValidated(profiledPosition: boolean) {
    this.preValidatedRules.managementRules.profiledPosition = profiledPosition;
    return this;
  }
  withCassationCourtNominationValidated(cassationCourtNomination: boolean) {
    this.preValidatedRules.managementRules.cassationCourtNomination =
      cassationCourtNomination;
    return this;
  }
  withOverseasToOverseasValidated(overseasToOverseas: boolean) {
    this.preValidatedRules.managementRules.overseasToOverseas =
      overseasToOverseas;
    return this;
  }
  withJudiciaryRoleAndJuridictionDegreeChangeValidated(
    judiciaryRoleAndJuridictionDegreeChange: boolean
  ) {
    this.preValidatedRules.managementRules.judiciaryRoleAndJuridictionDegreeChange =
      judiciaryRoleAndJuridictionDegreeChange;
    return this;
  }
  withJudiciaryRoleAndJuridictionDegreeChangeInSameRessortValidated(
    judiciaryRoleAndJuridictionDegreeChangeInSameRessort: boolean
  ) {
    this.preValidatedRules.managementRules.judiciaryRoleAndJuridictionDegreeChangeInSameRessort =
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
  withRuleValidated(
    ruleGroup: RuleGroup,
    ruleName: RuleName,
    validated: boolean
  ) {
    this.preValidatedRules[ruleGroup][ruleName] = validated;
    return this;
  }

  build(): NominationCase {
    return {
      id: this.id,
      name: this.name,
      biography: this.biography,
      preValidatedRules: this.preValidatedRules,
    };
  }
}
