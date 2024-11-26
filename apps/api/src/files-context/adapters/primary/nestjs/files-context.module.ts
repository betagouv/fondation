import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { minioS3StorageClient } from 'src/files-context/adapters/secondary/gateways/providers/minio-s3-sorage.client';
import { UploadFileUseCase } from 'src/files-context/business-logic/use-cases/file-upload/upload-file';
import { GenerateFilesUrlsUseCase } from 'src/files-context/business-logic/use-cases/files-url-generation/generate-files-urls';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { RealS3StorageProvider } from '../../secondary/gateways/providers/real-s3-storage.provider';
import { SqlFileRepository } from '../../secondary/gateways/repositories/drizzle/sql-file.repository';
import { FilesController } from './files.controller';
import { generateFilesProvider as generateProvider } from './provider-generator';
import { FILE_REPOSITORY, S3_STORAGE_PROVIDER } from './tokens';
import { MinioS3Commands } from '../../secondary/gateways/providers/minio-s3-commands';
import { S3Commands } from 'src/files-context/business-logic/gateways/providers/s3-commands';

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
    generateProvider(GenerateFilesUrlsUseCase, [
      FILE_REPOSITORY,
      TRANSACTION_PERFORMER,
      S3_STORAGE_PROVIDER,
    ]),

    generateProvider(SqlFileRepository, [], FILE_REPOSITORY),
    generateProvider(
      RealS3StorageProvider,
      [S3Client, API_CONFIG, S3Commands],
      S3_STORAGE_PROVIDER,
    ),
    {
      provide: S3Client,
      useValue: minioS3StorageClient,
    },
    { provide: S3Commands, useClass: MinioS3Commands },
  ],
  exports: [],
})
export class FilesContextModule {}
