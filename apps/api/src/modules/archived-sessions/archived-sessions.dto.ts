import z from 'zod';

import { createSortableDto } from '../framework/sorting';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { isDefined } from 'src/utils/is-defined';

export class ListArchivedNominationSessionsQueryDto extends createSortableDto(
  z.object({
    search: z
      .string()
      .trim()
      .optional()
      .transform((x) => (x?.length === 0 ? undefined : x)),
    sortBy: z.enum(['date', 'dueDate']).optional(),
    formations: z
      .preprocess(
        (x) => (isDefined(x) ? ([] as unknown[]).concat(x) : x),
        z.array(z.enum(FormationEnum)).optional(),
      )
      .optional(),
  }),
) {}
