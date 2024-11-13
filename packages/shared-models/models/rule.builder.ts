import { rulesTuple } from "./nomination-file";
import { NominationFile } from "./nomination-file.namespace";
import { Get, Paths } from "type-fest";
import _ from "lodash";

type RuleFunction<T> = (rule: {
  ruleGroup: NominationFile.RuleGroup;
  ruleName: NominationFile.RuleName;
}) => T;

export abstract class RulesBuilder<T = NominationFile.RuleValue> {
  private readonly _rules: NominationFile.Rules<T>;

  constructor(defaultRuleValue: T | RuleFunction<T>) {
    this._rules = rulesTuple.reduce((acc, [ruleGroup, ruleName]) => {
      return {
        ...acc,
        [ruleGroup]: {
          ...acc[ruleGroup],
          [ruleName]:
            typeof defaultRuleValue === "function"
              ? (defaultRuleValue as RuleFunction<T>)({
                  ruleGroup,
                  ruleName,
                })
              : defaultRuleValue,
        },
      };
    }, {} as NominationFile.Rules<T>);
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
