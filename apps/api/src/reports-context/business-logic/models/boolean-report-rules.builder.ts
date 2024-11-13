import { RulesBuilder } from 'shared-models';

export class BooleanReportRulesBuilder extends RulesBuilder<boolean> {
  constructor() {
    super(true);
  }
}
