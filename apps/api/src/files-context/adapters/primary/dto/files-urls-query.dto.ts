import { createZodDto } from 'nestjs-zod';
import { fileUrlsQuerySchema } from 'shared-models';

export class FilesUrlsQueryDto extends createZodDto(fileUrlsQuerySchema) {}
