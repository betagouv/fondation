import z from 'zod';

import { Magistrat } from 'shared-models';

import { createSortableDto } from '../framework/sorting';
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
        z.array(z.enum(Magistrat.Formation)).optional(),
      )
      .optional(),
  }),
) {}
