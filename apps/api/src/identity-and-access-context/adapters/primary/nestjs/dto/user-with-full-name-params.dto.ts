import { createZodDto } from 'nestjs-zod';
import { userWithFullNameParamsDtoSchema } from 'shared-models';

export class UserWithFullNameParamsNestDto extends createZodDto(
  userWithFullNameParamsDtoSchema,
) {}
