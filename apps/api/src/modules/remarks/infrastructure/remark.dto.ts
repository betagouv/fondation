import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { REMARK_STATUSES } from '../domain/remark';

export class SendRemarkDto extends createZodDto(
  z.object({
    text: z.string().trim().min(1).max(2_000),
    // a path of Fondation only, as the admin opens it from the list: browsers read `//` and `/\` as another site
    url: z
      .string()
      .max(2_000)
      .regex(/^\/(?![/\\])/),
  }),
) {}

export class ChangeRemarkStatusDto extends createZodDto(z.object({ status: z.enum(REMARK_STATUSES) })) {}
