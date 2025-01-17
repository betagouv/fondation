import { createZodDto } from 'nestjs-zod';
import { userWithIdParamsDtoSchema } from 'shared-models';

export class UserWithIdParamsNestDto extends createZodDto(
  userWithIdParamsDtoSchema,
) {}
