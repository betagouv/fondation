import {
  Magistrat,
  NominationFile,
  ruleGroupToRuleNames,
  Transparency,
} from "shared-models";
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
type RuleCheckedEntry =
  NominationFileVM["rulesChecked"][NominationFile.RuleGroup];

export class NominationFileVM {
  static magistratIdentityLabels = {
    birthDate: "Date de naissance",
    grade: "Grade",
    currentPosition: "Poste actuel",
    targettedPosition: "Poste pressenti",
    rank: "Rang",
  };

  static commentLabel = "Commentaires généraux du rapporteur";
  static commentPlaceholder = "Pas de commentaire";

  static ruleGroupToLabel: {
    [NominationFile.RuleGroup.MANAGEMENT]: string;

    [NominationFile.RuleGroup.STATUTORY]: string;

    [NominationFile.RuleGroup.QUALITATIVE]: string;
  } = {
    [NominationFile.RuleGroup.MANAGEMENT]: "Règles de gestion",
    [NominationFile.RuleGroup.STATUTORY]: "Règles statutaires",
    [NominationFile.RuleGroup.QUALITATIVE]:
      "Les autres éléments qualitatifs à vérifier",
  };
  static rulesToLabels: {
    [NominationFile.RuleGroup.MANAGEMENT]: Record<
      NominationFile.ManagementRule,
      string
    >;
    [NominationFile.RuleGroup.STATUTORY]: Record<
      NominationFile.StatutoryRule,
      string
    >;
    [NominationFile.RuleGroup.QUALITATIVE]: Record<
      NominationFile.QualitativeRule,
      string
    >;
  } = {
    [NominationFile.RuleGroup.MANAGEMENT]: {
      TRANSFER_TIME: "Obtenir une mutation en moins de 3 ans",
      GETTING_FIRST_GRADE: "Passer au 1er grade",
      GETTING_GRADE_HH: "Passer au grade HH",
      GETTING_GRADE_IN_PLACE: "Prendre son grade sur place",
      PROFILED_POSITION: 'Poste "profilé"',
      CASSATION_COURT_NOMINATION: "Nomination à la court de cassation",
      OVERSEAS_TO_OVERSEAS: 'Être muté "d\'Outremer sur Outremer"',
      JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE:
        "Passer du siège au parquet tout en passant d'un TJ à une CA (ou l'inverse)",
      JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT:
        "Passer du siège au parquet (ou l'inverse) au sein d'un même ressort",
    },
    [NominationFile.RuleGroup.STATUTORY]: {
      JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION: "Changement de juridiction",
      GRADE_ON_SITE_AFTER_7_YEARS: "Prendre son grade sur place après 7 ans",
      MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS:
        "Changement de ministère en moins de 3 ans",
      MINISTER_CABINET: "Cabinet du ministre",
      GRADE_REGISTRATION: "Inscription au tableau pour prise de grade",
      HH_WITHOUT_2_FIRST_GRADE_POSITIONS:
        "Accéder à la HH sans avoir fait 2 postes au 1er grade",
      LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO:
        "Profession juridique dans le ressort du TJ il y a moins de 5 ans",
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
    public biography: string | null,
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

    const createRulesCheckedEntryFor = <G extends NominationFile.RuleGroup>(
      ruleGroup: G,
    ) =>
      ({
        [ruleGroup]: createRulesCheckedFor(ruleGroup),
      }) as Pick<NominationFileVM["rulesChecked"], G>;

    const createRulesCheckedFor = <G extends NominationFile.RuleGroup>(
      ruleGroup: G,
    ) =>
      Object.values<
        | NominationFile.ManagementRule
        | NominationFile.StatutoryRule
        | NominationFile.QualitativeRule
      >(ruleGroupToRuleNames[ruleGroup]).reduce(
        (acc, ruleName) => ({
          ...acc,
          ...createRuleCheckedEntryFromValidatedRules(
            nominationFile.rules[ruleGroup],
            ruleGroup,
            ruleName,
          ),
        }),
        {} as RuleCheckedEntry,
      );

    return {
      id: nominationFile.id,
      name: nominationFile.name,
      biography: nominationFile.biography
        ? formatBiography(nominationFile.biography)
        : null,
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
        ...createRulesCheckedEntryFor(NominationFile.RuleGroup.MANAGEMENT),
        ...createRulesCheckedEntryFor(NominationFile.RuleGroup.STATUTORY),
        ...createRulesCheckedEntryFor(NominationFile.RuleGroup.QUALITATIVE),
      },
    };
  },
);

const formatBiography = (biography: string) => {
  if (biography.indexOf("- ") === -1) return biography;

  const biographyElements = biography
    .trim()
    .split("- ")
    .map((part) => part.trim());
  // we skipt the real first element because it is empty
  const [, firstElement, ...otherElements] = biographyElements;
  return `- ${firstElement}\n- ${otherElements.join("\n- ")}`;
};

const createRuleCheckedEntryFromValidatedRules = <
  G extends NominationFile.RuleGroup,
>(
  validatedRules: NominationFile.Rules[G],
  ruleGroup: G,
  ruleName: NominationFile.RuleName,
) => {
  const ruleValue = (
    validatedRules as Record<NominationFile.RuleName, NominationFile.RuleValue>
  )[ruleName];

  const values: VMNominationFileRuleValue = {
    id: ruleValue.id,
    label: (
      NominationFileVM.rulesToLabels[ruleGroup] as Record<
        NominationFile.RuleName,
        string
      >
    )[ruleName as NominationFile.RuleName],
    checked: !ruleValue.validated,
    highlighted: ruleValue.preValidated,
    comment: ruleValue.comment,
  };

  return {
    [ruleName]: values,
  } as RuleCheckedEntry;
};
