import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PasswordSchema } from '../../../shared/password.schema';

export const LoginDtoSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().nonempty().trim(),
});

export class LoginDto extends createZodDto(LoginDtoSchema) {}

export class ChangePasswordDto extends createZodDto(
  z.object({
    currentPassword: LoginDtoSchema.shape.password,
    newPassword: PasswordSchema,
  }),
) {}
