import { NominationFileRule } from 'src/reporter-context/business-logic/models/NominationFileReport';

export interface ChangeRuleValidationStateDto {
  validated: boolean;
  rule: NominationFileRule;
}
