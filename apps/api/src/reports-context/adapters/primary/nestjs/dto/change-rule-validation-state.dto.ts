import { createZodDto } from 'nestjs-zod';
import { changeRuleValidationStateDto } from 'shared-models';

export class ChangeRuleValidationStateDto extends createZodDto(
  changeRuleValidationStateDto,
) {}
