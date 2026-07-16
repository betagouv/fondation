import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { GenderEnum } from 'src/modules/shared/gender.enum';
import { RoleEnum } from 'src/modules/shared/role.enum';

export const LoginDtoSchema = z.object({
  email: z.email().trim(),
  password: z.string().nonempty().trim(),
});

export class LoginDto extends createZodDto(LoginDtoSchema) {}

export class RegisterUserDto extends createZodDto(
  z.object({
    firstName: z.string(),
    lastName: z.string(),
    gender: z.enum(GenderEnum),
    email: z.email().toLowerCase(),
    password: z.string(),
    role: z.enum(RoleEnum).nullish(),
  }),
) {}

export class RegisteredUserDto extends createZodDto(z.object({ id: z.uuid() })) {}
