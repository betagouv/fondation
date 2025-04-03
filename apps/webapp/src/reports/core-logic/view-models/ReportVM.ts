import {
  AllRulesMapV2,
  Magistrat,
  NominationFile,
  Transparency,
} from "shared-models";
import { Simplify } from "type-fest";
import { reportStateFilterTitle } from "../../adapters/primary/labels/state-filter-labels";
import { stateToLabel } from "../../adapters/primary/labels/state-label.mapper";

export type VMReportRuleValue<Selected extends boolean = boolean> = {
  id: string;
  label: string;
  hint: string | JSX.Element;
  checked: boolean;
  highlighted: boolean;
} & (Selected extends true
  ?
      | { checked: true; highlighted: true }
      | { checked: false; highlighted: true }
      | { checked: true; highlighted: false }
  : { checked: false; highlighted: false });

export class ReportVM<
  RulesMap extends AllRulesMapV2 = AllRulesMapV2,
  RuleName extends
    NominationFile.RuleName = RulesMap[NominationFile.RuleGroup][number],
  ManagementRules extends NominationFile.RuleName = Extract<
    NominationFile.ManagementRule,
    RuleName
  >,
  StatutoryRules extends NominationFile.RuleName = Extract<
    NominationFile.StatutoryRule,
    RuleName
  >,
  QualitativeRules extends NominationFile.RuleName = Extract<
    NominationFile.QualitativeRule,
    RuleName
  >,
> {
  static stateSelectLabel = reportStateFilterTitle;
  static stateSelectOptions = Object.values(NominationFile.ReportState).reduce(
    (acc, state) => ({
      ...acc,
      [state]: stateToLabel(state),
    }),
    {} as Record<NominationFile.ReportState, string>,
  );
  static magistratIdentityLabels = {
    birthDate: "Date de naissance",
    grade: "Grade",
    currentPosition: "Poste actuel",
    targettedPosition: "Poste pressenti",
    rank: "Rang",
  };

  static commentLabel = "Rapport";
  static biographyLabel = "Biographie";
  static observersLabel = "Observants";
  static attachedFilesLabel = "Ajouter des pièces jointes";

  static ruleGroupToLabel: {
    [NominationFile.RuleGroup.MANAGEMENT]: string;

    [NominationFile.RuleGroup.STATUTORY]: string;

    [NominationFile.RuleGroup.QUALITATIVE]: string;
  } = {
    [NominationFile.RuleGroup.MANAGEMENT]: "Lignes directrices de gestion",
    [NominationFile.RuleGroup.STATUTORY]: "Règles statutaires",
    [NominationFile.RuleGroup.QUALITATIVE]: "Éléments qualitatifs",
  };

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly biography: string | null,
    public readonly dueDate: string | null,
    public birthDate: string,
    public readonly state: NominationFile.ReportState,
    public readonly formation: Magistrat.Formation,
    public readonly transparency: Transparency,
    public readonly grade: Magistrat.Grade,
    public readonly currentPosition: string,
    public readonly targettedPosition: string,
    public readonly comment: string | null,
    public readonly rank: string,
    public readonly observers: [string, ...string[]][] | null,
    public readonly attachedFiles:
      | {
          name: string;
          signedUrl: string | null;
        }[]
      | null,

    public readonly rulesChecked: Simplify<
      GroupRulesChecked<NominationFile.RuleGroup.MANAGEMENT, ManagementRules> &
        GroupRulesChecked<NominationFile.RuleGroup.STATUTORY, StatutoryRules> &
        GroupRulesChecked<
          NominationFile.RuleGroup.QUALITATIVE,
          QualitativeRules
        >
    >,
  ) {}
}

export type GroupRulesChecked<
  G extends NominationFile.RuleGroup,
  R extends NominationFile.RuleName,
> = Record<
  G,
  {
    selected: Partial<Record<R, VMReportRuleValue<true>>>;
    others: Partial<Record<R, VMReportRuleValue<false>>>;
  }
>;
