import { NominationFileRuleName } from 'src/reporter-context/business-logic/models/nomination-file-report';

export interface ChangeRuleValidationStateDto {
  validated: boolean;
  rule: NominationFileRuleName;
}
