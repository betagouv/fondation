import { Injectable, mixin, NestInterceptor, Type } from '@nestjs/common';
import { FilesInterceptor as NestFilesInterceptor } from '@nestjs/platform-express';

export function FilesInterceptor(fieldName: string): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor extends NestFilesInterceptor(fieldName, undefined, {
    fileFilter: (_, file, cb) => {
      // Une issue est ouverte afin d'éviter cette conversion :
      // https://github.com/expressjs/multer/issues/1104
      file.originalname = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );
      cb(null, true);
    },
  }) {}

  return mixin(MixinInterceptor);
}
