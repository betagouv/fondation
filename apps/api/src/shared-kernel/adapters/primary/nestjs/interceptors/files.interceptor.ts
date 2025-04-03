import { FilesInterceptor as MulterFilesInterceptor } from '@nestjs/platform-express';
import { multerFileFilter } from './multer-filter';

export const FilesInterceptor = (fieldName: string) =>
  MulterFilesInterceptor(fieldName, undefined, {
    fileFilter: multerFileFilter,
  });
