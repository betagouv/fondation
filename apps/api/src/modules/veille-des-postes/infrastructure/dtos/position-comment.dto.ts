import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { COMMENT_MAX_LENGTH } from '../../domain/position-comment';

export class WritePositionCommentDto extends createZodDto(
  z.object({ comment: z.string().max(COMMENT_MAX_LENGTH) }),
) {}
