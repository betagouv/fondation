import { Module } from '@nestjs/common';
import { FilesController } from '../files.controller';

@Module({
  imports: [],
  controllers: [FilesController],
  providers: [],
  exports: [],
})
export class FilesContextModule {}
