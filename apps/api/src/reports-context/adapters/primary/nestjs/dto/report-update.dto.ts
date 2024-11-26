import { createZodDto } from 'nestjs-zod';
import { changeRuleValidationStateDto, reportUpdateDto } from 'shared-models';

export class ReportUpdateDto extends createZodDto(reportUpdateDto) {}
export class ChangeRuleValidationStateDto extends createZodDto(
  changeRuleValidationStateDto,
) {}
