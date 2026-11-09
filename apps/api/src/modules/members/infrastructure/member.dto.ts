import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TitleSchema } from '../../shared/title.schema';

export class ExcludeJurisdictionsDto extends createZodDto(
  z.object({ jurisdictionIds: z.array(z.string()) }),
) {}

export class UpdateMemberDisplayTitleDto extends createZodDto(z.object({ displayTitle: TitleSchema })) {}
