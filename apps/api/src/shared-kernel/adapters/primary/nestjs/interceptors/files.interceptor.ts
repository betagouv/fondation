import { Injectable, mixin, NestInterceptor, Type } from '@nestjs/common';
import { FilesInterceptor as NestFilesInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export function FilesInterceptor(
  fieldName: string,
  maxCount?: number,
  localOptions?: MulterOptions,
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor extends NestFilesInterceptor(
    fieldName,
    maxCount,
    localOptions,
  ) {}

  return mixin(MixinInterceptor);
}
