import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { GenderEnum } from '../../../shared/gender.enum';
import { RoleEnum } from '../../../shared/role.enum';

export const LoginDtoSchema = z.object({
  email: z.string().trim().pipe(z.email()),
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
    isAdmin: z.boolean().optional(),
  }),
) {}

export class RegisteredUserDto extends createZodDto(z.object({ id: z.uuid() })) {}
