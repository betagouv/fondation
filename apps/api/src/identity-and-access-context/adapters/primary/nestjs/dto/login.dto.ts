import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const loginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export class LoginDto extends createZodDto(loginDtoSchema) {}
