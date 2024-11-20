import { Module } from '@nestjs/common';
import { UploadFileUseCase } from 'src/files-context/business-logic/use-cases/file-upload/upload-file';
import {
  DATE_TIME_PROVIDER,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { FilesController } from './files.controller';
import { generateFilesProvider as generateProvider } from './provider-generator';
import { FILE_REPOSITORY, S3_STORAGE_PROVIDER } from './tokens';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { SqlFileRepository } from '../../secondary/gateways/repositories/drizzle/sql-file.repository';
import { FakeS3StorageProvider } from 'src/data-administration-context/adapters/secondary/gateways/providers/fake-s3-storage.provider';

@Module({
  imports: [SharedKernelModule],
  controllers: [FilesController],
  providers: [
    generateProvider(UploadFileUseCase, [
      FILE_REPOSITORY,
      TRANSACTION_PERFORMER,
      UUID_GENERATOR,
      DATE_TIME_PROVIDER,
      S3_STORAGE_PROVIDER,
    ]),
    generateProvider(SqlFileRepository, [], FILE_REPOSITORY),
    generateProvider(FakeS3StorageProvider, [], S3_STORAGE_PROVIDER),
  ],
  exports: [],
})
export class FilesContextModule {}
