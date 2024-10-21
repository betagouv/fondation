import { Magistrat, NominationFile, Transparency } from "@/shared-models";
import { createSelector } from "@reduxjs/toolkit";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { AppState } from "../../../store/appState";

export type VMNominationFileRuleValue = {
  id: string;
  label: string;
  checked: boolean;
  highlighted: boolean;
  comment: string | null;
};
type RuleCheckedEntry = Record<
  NominationFile.RuleName,
  VMNominationFileRuleValue
>;

export class NominationFileVM {
  static magistratIdentityLabels = {
    birthDate: "Date de naissance",
    grade: "Grade",
    currentPosition: "Poste actuel",
    targettedPosition: "Poste pressenti",
    rank: "Rang",
  };

  static rulesToLabels: {
    [NominationFile.RuleGroup.MANAGEMENT]: {
      [key in NominationFile.ManagementRule]: string;
    };
    [NominationFile.RuleGroup.STATUTORY]: {
      [key in NominationFile.StatutoryRule]: string;
    };
    [NominationFile.RuleGroup.QUALITATIVE]: {
      [key in NominationFile.QualitativeRule]: string;
    };
  } = {
    [NominationFile.RuleGroup.MANAGEMENT]: {
      TRANSFER_TIME: "Obtenir une mutation en moins de 3 ans",
      GETTING_FIRST_GRADE: "Getting first grade",
      GETTING_GRADE_HH: "Getting grade HH",
      GETTING_GRADE_IN_PLACE: "Prendre son grade sur place",
      PROFILED_POSITION: 'Être nommé sur un poste "profilé"',
      CASSATION_COURT_NOMINATION: "Cassation court nomination",
      OVERSEAS_TO_OVERSEAS: 'Être muté "d\'Outremer sur Outremer"',
      JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE:
        "Passer du siège au parquet tout en passant d'un TJ à une CA (ou l'inverse)",
      JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT:
        "Passer du siège au parquet (ou l'inverse) au sein d'un même ressort",
    },
    [NominationFile.RuleGroup.STATUTORY]: {
      JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION: "Changement de juridiction",
      GRADE_ON_SITE_AFTER_7_YEARS: "Grade sur place après 7 ans",
      MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS:
        "Changement de ministère en moins de 3 ans",
      MINISTER_CABINET: "Cabinet ministériel",
      GRADE_REGISTRATION: "Inscription au grade",
      HH_WITHOUT_2_FIRST_GRADE_POSITIONS: "HH sans 2 premiers grades",
      LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO:
        "Profession juridique en cour judiciaire il y a moins de 5 ans",
    },
    [NominationFile.RuleGroup.QUALITATIVE]: {
      CONFLICT_OF_INTEREST_PRE_MAGISTRATURE:
        "Conflit d'intérêt pré magistrature",
      CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION:
        "Conflit d'intérêt avec profession parente",
      EVALUATIONS: "Évaluations",
      DISCIPLINARY_ELEMENTS: "Éléments disciplinaires",
      HH_NOMINATION_CONDITIONS: "Conditions de nomination HH",
    },
  };

  constructor(
    public id: string,
    public name: string,
    public biography: string,
    public dueDate: string | null,
    public birthDate: string,
    public state: NominationFile.ReportState,
    public formation: Magistrat.Formation,
    public transparency: Transparency,
    public grade: Magistrat.Grade,
    public currentPosition: string,
    public targettedPosition: string,
    public comment: string | null,
    public rank: string,

    public rulesChecked: {
      [NominationFile.RuleGroup.MANAGEMENT]: Record<
        NominationFile.ManagementRule,
        VMNominationFileRuleValue
      >;
      [NominationFile.RuleGroup.STATUTORY]: Record<
        NominationFile.StatutoryRule,
        VMNominationFileRuleValue
      >;
      [NominationFile.RuleGroup.QUALITATIVE]: Record<
        NominationFile.QualitativeRule,
        VMNominationFileRuleValue
      >;
    },
  ) {}
}

export const selectNominationFile = createSelector(
  [
    (state: AppState) => state.nominationFileOverview.byIds,
    (_, id: string) => id,
  ],
  (byIds, id): NominationFileVM | null => {
    const nominationFile = byIds?.[id];
    if (!nominationFile) return null;

    const createManagementRuleCheckedEntryFromValidatedRules = (
      ruleName: NominationFile.ManagementRule,
    ): RuleCheckedEntry =>
      createRuleCheckedEntryFromValidatedRules(
        nominationFile.rules.management,
        NominationFile.RuleGroup.MANAGEMENT,
        ruleName,
      );

    const createStatutoryRuleCheckedEntryFromValidatedRules = (
      ruleName: NominationFile.StatutoryRule,
    ): RuleCheckedEntry =>
      createRuleCheckedEntryFromValidatedRules(
        nominationFile.rules.statutory,
        NominationFile.RuleGroup.STATUTORY,
        ruleName,
      );

    const createQualitativeRuleCheckedEntryFromValidatedRules = (
      ruleName: NominationFile.QualitativeRule,
    ): RuleCheckedEntry =>
      createRuleCheckedEntryFromValidatedRules(
        nominationFile.rules.qualitative,
        NominationFile.RuleGroup.QUALITATIVE,
        ruleName,
      );

    return {
      id: nominationFile.id,
      name: nominationFile.name,
      biography: nominationFile.biography,
      dueDate: nominationFile.dueDate
        ? DateOnly.fromStoreModel(nominationFile.dueDate).toFormattedString()
        : null,
      birthDate: DateOnly.fromStoreModel(
        nominationFile.birthDate,
      ).toFormattedString(),
      state: nominationFile.state,
      formation: nominationFile.formation,
      transparency: nominationFile.transparency,
      grade: nominationFile.grade,
      currentPosition: nominationFile.currentPosition,
      targettedPosition: nominationFile.targettedPosition,
      comment: nominationFile.comment,
      rank: nominationFile.rank,

      rulesChecked: {
        management: Object.values(NominationFile.ManagementRule).reduce(
          (acc, ruleName) => ({
            ...acc,
            ...createManagementRuleCheckedEntryFromValidatedRules(ruleName),
          }),
          {} as RuleCheckedEntry,
        ),
        statutory: Object.values(NominationFile.StatutoryRule).reduce(
          (acc, ruleName) => ({
            ...acc,
            ...createStatutoryRuleCheckedEntryFromValidatedRules(ruleName),
          }),
          {} as RuleCheckedEntry,
        ),
        qualitative: Object.values(NominationFile.QualitativeRule).reduce(
          (acc, ruleName) => ({
            ...acc,
            ...createQualitativeRuleCheckedEntryFromValidatedRules(ruleName),
          }),
          {} as RuleCheckedEntry,
        ),
      },
    };
  },
);

const createRuleCheckedEntryFromValidatedRules = (
  validatedRules: NominationFile.Rules[NominationFile.RuleGroup],
  ruleGroup: NominationFile.RuleGroup,
  ruleName: NominationFile.RuleName,
) => {
  const ruleValue = (
    validatedRules as Record<NominationFile.RuleName, NominationFile.RuleValue>
  )[ruleName];

  const values: RuleCheckedEntry[NominationFile.RuleName] = {
    id: ruleValue.id,
    label: (
      NominationFileVM.rulesToLabels[ruleGroup] as Record<
        NominationFile.RuleName,
        string
      >
    )[ruleName],
    checked: !ruleValue.validated,
    highlighted: ruleValue.preValidated,
    comment: ruleValue.comment,
  };

  return {
    [ruleName]: values,
  } as RuleCheckedEntry;
};
