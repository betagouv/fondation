import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Gender, Role } from 'shared-models';

export const LoginDtoSchema = z.object({
  email: z.email().trim(),
  password: z.string().nonempty().trim(),
});

export class LoginDto extends createZodDto(LoginDtoSchema) {}

export class RegisterUserDto extends createZodDto(
  z.object({
    firstName: z.string(),
    lastName: z.string(),
    gender: z.enum(Gender),
    email: z.email().toLowerCase(),
    password: z.string(),
    role: z.enum(Role).nullish(),
  }),
) {}

export class RegisteredUserDto extends createZodDto(z.object({ id: z.uuid() })) {}
