import { createZodDto } from 'nestjs-zod';
import { userCanReadFileParamsDtoSchema } from 'shared-models';

export class UserCanReadFileParamsNestDto extends createZodDto(
  userCanReadFileParamsDtoSchema,
) {}
