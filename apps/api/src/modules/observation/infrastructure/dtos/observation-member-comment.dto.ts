import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export class WriteMemberCommentDto extends createZodDto(
  z.object({
    comment: z.string(),
  }),
) {}

export class AttachMemberCommentScreenshotsDto extends createZodDto(
  z.object({
    files: z.array(z.file()),
  }),
) {}

export class AttachedMemberCommentScreenshotsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
      }),
    ),
  }),
) {}
