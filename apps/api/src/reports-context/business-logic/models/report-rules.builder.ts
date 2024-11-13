import _ from 'lodash';
import { NominationFile } from 'shared-models';
import { Get, Paths } from 'type-fest';
import { ReportRuleSnapshot } from './report-rules';

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

  build(): ReportRuleSnapshot {
    return this._snapshot;
  }
}
