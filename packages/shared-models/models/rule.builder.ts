import { allRulesMapV2 } from "./nomination-file";
import { NominationFile } from "./nomination-file.namespace";
import { Get, Paths } from "type-fest";
import _ from "lodash";

type RuleFunction<
  T,
  M extends string = NominationFile.ManagementRule,
  S extends string = NominationFile.StatutoryRule,
  Q extends string = NominationFile.QualitativeRule,
> = (rule: { ruleGroup: NominationFile.RuleGroup; ruleName: M | S | Q }) => T;

export abstract class RulesBuilder<
  T = NominationFile.RuleValue,
  M extends string = NominationFile.ManagementRule,
  S extends string = NominationFile.StatutoryRule,
  Q extends string = NominationFile.QualitativeRule,
> {
  private readonly _rules: NominationFile.Rules<T, M, S, Q>;

  constructor(
    defaultRuleValue: T | RuleFunction<T, M, S, Q>,
    rulesMap: {
      [NominationFile.RuleGroup.MANAGEMENT]: M[];
      [NominationFile.RuleGroup.STATUTORY]: S[];
      [NominationFile.RuleGroup.QUALITATIVE]: Q[];
    },
    initialRules?: NominationFile.Rules<T, M, S, Q>
  ) {
    const rules = Object.entries(rulesMap).reduce(
      (acc, [ruleGroup, ruleNames]) => {
        const group = ruleGroup as NominationFile.RuleGroup;
        return {
          ...acc,
          [group]: {
            ...acc[group],
            ..._.merge(
              {},
              ...ruleNames.map((ruleName) => ({
                [ruleName]:
                  typeof defaultRuleValue === "function"
                    ? (defaultRuleValue as RuleFunction<T, M, S, Q>)({
                        ruleGroup: group,
                        ruleName,
                      })
                    : defaultRuleValue,
              }))
            ),
          },
        };
      },
      {} as NominationFile.Rules<T, M, S, Q>
    );
    this._rules = _.merge(rules, initialRules);
  }

  with<
    K extends Paths<NominationFile.Rules<T, M, S, Q>>,
    V extends Get<NominationFile.Rules<T, M, S, Q>, K> = Get<
      NominationFile.Rules<T, M, S, Q>,
      K
    >,
  >(property: K, value: V) {
    _.set(this._rules, property, value);
    return this;
  }

  build(): NominationFile.Rules<T, M, S, Q> {
    return this._rules;
  }
}
