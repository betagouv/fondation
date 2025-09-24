import { createZodDto } from 'nestjs-zod';
import { formationDtoSchema } from 'shared-models';

export class FormationQueryParamsDto extends createZodDto(formationDtoSchema) {}
