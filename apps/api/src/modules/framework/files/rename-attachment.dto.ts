import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export class RenameAttachmentDto extends createZodDto(
  z.object({
    name: z.string().describe('the new name, without extension: the file keeps the one it was added with'),
  }),
) {}
