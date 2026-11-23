import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TitleSchema } from '../../shared/title.schema';

export class ExcludeJurisdictionsDto extends createZodDto(
  z.object({ jurisdictionIds: z.array(z.string()) }),
) {}

export class ExcludeMagistratsDto extends createZodDto(
  z.object({ magistratIds: z.array(z.uuid()).max(500) }),
) {}

export class UpdateMemberDisplayTitleDto extends createZodDto(z.object({ displayTitle: TitleSchema })) {}
