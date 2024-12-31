import { createZodDto } from 'nestjs-zod';
import { fileUrlsQuerySchema } from 'shared-models/models/endpoints/files';

export class FilesUrlsQueryDto extends createZodDto(fileUrlsQuerySchema) {}
