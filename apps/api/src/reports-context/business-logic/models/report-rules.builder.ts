import _ from 'lodash';
import { NominationFile } from 'shared-models';
import { Get, Paths } from 'type-fest';
import { ReportRuleSnapshot } from './report-rules';

export class ReportRuleBuilder {
  private _snapshot: ReportRuleSnapshot;

  constructor(idMode: 'fake' | 'uuid' = 'fake') {
    this._snapshot = {
      id:
        idMode === 'fake' ? 'rule-id' : 'cd1619e2-263d-49b6-b928-6a04ee681132',
      createdAt: new Date(2021, 1, 1),
      reportId:
        idMode === 'fake'
          ? 'report-id'
          : 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
      ruleGroup: NominationFile.RuleGroup.MANAGEMENT,
      ruleName: NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE,
      preValidated: true,
      validated: true,
    };
  }

  with<
    K extends Paths<ReportRuleSnapshot>,
    V extends Get<ReportRuleSnapshot, K> = Get<ReportRuleSnapshot, K>,
  >(property: K, value: V) {
    this._snapshot = _.set(this._snapshot, property, value);
    return this;
  }

  withGettingGradeInPlaceRuleValidated(validated: boolean): this {
    this._snapshot.ruleGroup = NominationFile.RuleGroup.MANAGEMENT;
    this._snapshot.ruleName =
      NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE;
    this._snapshot.validated = validated;
    return this;
  }

  build(): ReportRuleSnapshot {
    return this._snapshot;
  }
}
