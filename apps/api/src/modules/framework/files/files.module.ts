import { Global, Module } from '@nestjs/common';

import { Files } from './files';
import { FilesController } from './files.controller';
import { StoreFileInterceptor } from './multipart/store-file.interceptor';
import { Sanitizer } from './sanitizers';
import { StorableModule } from './storable/storable.module';

@Global()
@Module({
  imports: [StorableModule],
  exports: [Files, Sanitizer, StorableModule],
  controllers: [FilesController],
  providers: [Sanitizer, StoreFileInterceptor, Files],
})
export class FilesModule {}
