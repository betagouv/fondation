import { allRulesMap } from "./nomination-file";
import { NominationFile } from "./nomination-file.namespace";
import { Get, Paths } from "type-fest";
import _ from "lodash";

type RuleFunction<T> = (rule: {
  ruleGroup: NominationFile.RuleGroup;
  ruleName: NominationFile.RuleName;
}) => T;

export abstract class RulesBuilder<T = NominationFile.RuleValue> {
  private readonly _rules: NominationFile.Rules<T>;

  constructor(
    defaultRuleValue: T | RuleFunction<T>,
    initialRules?: NominationFile.Rules<T>,
    rulesMap = allRulesMap
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
                    ? (defaultRuleValue as RuleFunction<T>)({
                        ruleGroup: group,
                        ruleName,
                      })
                    : defaultRuleValue,
              }))
            ),
          },
        };
      },
      {} as NominationFile.Rules<T>
    );
    this._rules = _.merge(rules, initialRules);
  }

  with<
    K extends Paths<NominationFile.Rules<T>>,
    V extends Get<NominationFile.Rules<T>, K> = Get<NominationFile.Rules<T>, K>,
  >(property: K, value: V) {
    _.set(this._rules, property, value);
    return this;
  }

  build(): NominationFile.Rules<T> {
    return this._rules;
  }
}
