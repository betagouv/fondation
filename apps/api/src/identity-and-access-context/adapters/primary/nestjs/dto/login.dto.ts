import { createZodDto } from 'nestjs-zod';
import { loginDtoSchema } from 'shared-models';

export class LoginNestDto extends createZodDto(loginDtoSchema) {}
