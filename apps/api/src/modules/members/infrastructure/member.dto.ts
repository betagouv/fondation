import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TitleSchema } from '../../shared/title.schema';

export class ExcludeJurisdictionsDto extends createZodDto(
  z.object({ jurisdictionIds: z.array(z.string()) }),
) {}

export class UpdateMemberDisplayTitleDto extends createZodDto(z.object({ displayTitle: TitleSchema })) {}

export class UpdateMemberRecusalTitleDto extends createZodDto(
  z.object({ recusalTitle: TitleSchema.meta({ description: 'with its article, e.g. "le Bâtonnier"' }) }),
) {}
