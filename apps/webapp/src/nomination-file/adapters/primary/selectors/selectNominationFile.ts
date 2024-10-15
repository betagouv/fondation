import { NominationFile } from "@/shared-models";
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
  static rulesToLabels: Record<NominationFile.RuleName, string> = {
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
  };

  constructor(
    public id: string,
    public name: string,
    public biography: string,
    public dueDate: string | null,
    public rulesChecked: Record<
      NominationFile.RuleGroup.MANAGEMENT,
      Record<NominationFile.RuleName, VMNominationFileRuleValue>
    >,
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
        ruleName,
      );

    return {
      id: nominationFile.id,
      name: nominationFile.name,
      biography: nominationFile.biography,
      dueDate: nominationFile.dueDate
        ? DateOnly.fromStoreModel(nominationFile.dueDate).toFormattedString()
        : null,
      rulesChecked: {
        management: Object.values(NominationFile.ManagementRule).reduce(
          (acc, ruleName) => ({
            ...acc,
            ...createManagementRuleCheckedEntryFromValidatedRules(ruleName),
          }),
          {} as RuleCheckedEntry,
        ),
      },
    };
  },
);

const createRuleCheckedEntryFromValidatedRules = (
  validatedRules: NominationFile.Rules[NominationFile.RuleGroup],
  ruleName: NominationFile.RuleName,
) => {
  const values: RuleCheckedEntry[NominationFile.RuleName] = {
    id: validatedRules[ruleName].id,
    label: NominationFileVM.rulesToLabels[ruleName],
    checked: !validatedRules[ruleName].validated,
    highlighted: validatedRules[ruleName].preValidated,
    comment: validatedRules[ruleName].comment,
  };

  return {
    [ruleName]: values,
  } as RuleCheckedEntry;
};
