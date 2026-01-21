import z from 'zod';
import { createZodDto } from 'nestjs-zod';

export class WriteMemberCommentDto extends createZodDto(
  z.object({
    comment: z.string(),
  }),
) {}

export class AttachMemberCommentFilesDto extends createZodDto(
  z.object({
    files: z.array(z.file()),
  }),
) {}

export class AttachedMemberCommentFilesDto extends createZodDto(
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
