import { Global, Module } from '@nestjs/common';

import { Files } from './files';
import { FilesController } from './files.controller';
import { StoreFileInterceptor } from './multipart/store-file.interceptor';
import { Sanitizer } from './sanitizers';

export const SSE_CONFIG_TOKEN = Symbol();

@Global()
@Module({
  exports: [Files, Sanitizer],
  controllers: [FilesController],
  providers: [Sanitizer, StoreFileInterceptor, Files],
})
export class FilesModule {}
