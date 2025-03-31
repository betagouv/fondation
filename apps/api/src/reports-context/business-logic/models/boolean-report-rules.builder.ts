import { RulesBuilder } from 'shared-models';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from 'src/data-administration-context/business-logic/models/rules';

export class BooleanReportRulesBuilder extends RulesBuilder<
  boolean,
  ManagementRule,
  StatutoryRule,
  QualitativeRule
> {
  constructor(validation = true) {
    super(validation, allRulesMapV1);
  }
}
