import z from 'zod';
import { createZodDto } from 'nestjs-zod';

export const LoginDtoSchema = z.object({
  email: z.email().trim(),
  password: z.string().nonempty().trim(),
});

export class LoginDto extends createZodDto(LoginDtoSchema) {}
