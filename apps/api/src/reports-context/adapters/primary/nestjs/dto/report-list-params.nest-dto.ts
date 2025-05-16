import { createZodDto } from 'nestjs-zod';
import { listReportsParamsDtoSchema } from 'shared-models';

export class ReportListParamsNestDto extends createZodDto(
  listReportsParamsDtoSchema,
) {}
