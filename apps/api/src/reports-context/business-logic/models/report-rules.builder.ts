import { NominationFile } from 'shared-models';
import { ReportRule, ReportRuleSnapshot } from './report-rules';
import _ from 'lodash';
import { Paths, Get } from 'type-fest';

export class ReportRuleBuilder {
  private _snapshot: ReportRuleSnapshot;

  constructor() {
    this._snapshot = {
      id: 'rule-id',
      createdAt: new Date(2021, 1, 1),
      reportId: 'report-id',
      ruleGroup: NominationFile.RuleGroup.MANAGEMENT,
      ruleName: NominationFile.ManagementRule.OVERSEAS_TO_OVERSEAS,
      preValidated: true,
      validated: true,
      comment: 'rule comment',
    };
  }

  with<
    K extends Paths<ReportRuleSnapshot>,
    V extends Get<ReportRuleSnapshot, K> = Get<ReportRuleSnapshot, K>,
  >(property: K, value: V) {
    this._snapshot = _.set(this._snapshot, property, value);
    return this;
  }

  withOverseasToOverseasRuleValidated(validated: boolean): this {
    this._snapshot.ruleGroup = NominationFile.RuleGroup.MANAGEMENT;
    this._snapshot.ruleName =
      NominationFile.ManagementRule.OVERSEAS_TO_OVERSEAS;
    this._snapshot.validated = validated;
    return this;
  }

  build(): ReportRule {
    return new ReportRule(
      this._snapshot.id,
      this._snapshot.createdAt,
      this._snapshot.reportId,
      this._snapshot.ruleGroup,
      this._snapshot.ruleName,
      this._snapshot.preValidated,
      this._snapshot.validated,
      this._snapshot.comment,
    );
  }
}
