import { FileInterceptor as MulterFileInterceptor } from '@nestjs/platform-express';
import { multerFileFilter } from './multer-filter';

export const FileInterceptor = (fieldName: string) =>
  MulterFileInterceptor(fieldName, {
    fileFilter: multerFileFilter,
  });
