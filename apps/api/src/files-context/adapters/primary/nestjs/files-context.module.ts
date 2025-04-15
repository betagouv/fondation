import { S3Client } from '@aws-sdk/client-s3';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { minioS3StorageClient } from 'src/files-context/adapters/secondary/gateways/providers/minio-s3-sorage.client';
import { S3Commands } from 'src/files-context/business-logic/gateways/providers/s3-commands';
import { DeleteFileUseCase } from 'src/files-context/business-logic/use-cases/file-deletion/delete-file';
import { UploadFileUseCase } from 'src/files-context/business-logic/use-cases/file-upload/upload-file';
import { DeleteFilesUseCase } from 'src/files-context/business-logic/use-cases/files-deletion/delete-files';
import { UploadFilesUseCase } from 'src/files-context/business-logic/use-cases/files-upload/upload-files';
import { GenerateFilesUrlsUseCase } from 'src/files-context/business-logic/use-cases/files-url-generation/generate-files-urls';
import { SystemRequestOrSessionValidationMiddleware } from 'src/shared-kernel/adapters/primary/nestjs/middleware/system-request-or-session-validation.middleware';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  TRANSACTION_PERFORMER,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { FakeS3StorageProvider } from '../../secondary/gateways/providers/fake-s3-storage.provider';
import { MinioS3Commands } from '../../secondary/gateways/providers/minio-s3-commands';
import { RealS3StorageProvider } from '../../secondary/gateways/providers/real-s3-storage.provider';
import { scalewayS3StorageClient } from '../../secondary/gateways/providers/scaleway-s3-sorage.client';
import { SqlFileRepository } from '../../secondary/gateways/repositories/drizzle/sql-file.repository';
import { baseRoute, endpointsPaths, FilesController } from './files.controller';
import { generateFilesProvider as generateProvider } from './provider-generator';
import {
  FILE_REPOSITORY,
  PERMISSIONS_SERVICE,
  S3_STORAGE_PROVIDER,
} from './tokens';
import { SystemRequestValidationMiddleware } from 'src/shared-kernel/adapters/primary/nestjs/middleware/system-request.middleware';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import { HttpPermissionsService } from '../../secondary/services/http-permissions.service';

const isProduction = process.env.NODE_ENV === 'production';
// We don't use Scaleway in the CI at the moment, because we have a long latency
// problem only in CI. It seems unrelated to rate limiting.
// const isCi = process.env.CI === 'true';
const isScalewayS3 = isProduction; //|| isCi;

@Module({
  imports: [SharedKernelModule],
  controllers: [FilesController],
  providers: [
    generateProvider(UploadFileUseCase, [
      FILE_REPOSITORY,
      TRANSACTION_PERFORMER,
      DATE_TIME_PROVIDER,
      S3_STORAGE_PROVIDER,
    ]),
    generateProvider(UploadFilesUseCase, [
      FILE_REPOSITORY,
      TRANSACTION_PERFORMER,
      DATE_TIME_PROVIDER,
      S3_STORAGE_PROVIDER,
    ]),
    generateProvider(GenerateFilesUrlsUseCase, [
      FILE_REPOSITORY,
      TRANSACTION_PERFORMER,
      S3_STORAGE_PROVIDER,
      PERMISSIONS_SERVICE,
    ]),
    generateProvider(DeleteFileUseCase, [
      TRANSACTION_PERFORMER,
      FILE_REPOSITORY,
      S3_STORAGE_PROVIDER,
    ]),
    generateProvider(DeleteFilesUseCase, [
      TRANSACTION_PERFORMER,
      FILE_REPOSITORY,
      S3_STORAGE_PROVIDER,
    ]),

    generateProvider(SqlFileRepository, [], FILE_REPOSITORY),
    generateProvider(FakeS3StorageProvider, [], S3_STORAGE_PROVIDER),
    {
      provide: S3_STORAGE_PROVIDER,
      useFactory: (
        s3Client: S3Client,
        apiConfig: ApiConfig,
        s3Commands: S3Commands,
      ) => {
        return new RealS3StorageProvider(s3Client, apiConfig, s3Commands);
      },
      inject: [S3Client, API_CONFIG, S3Commands],
    },
    {
      provide: S3Client,
      useValue: isScalewayS3 ? scalewayS3StorageClient : minioS3StorageClient,
    },
    { provide: S3Commands, useClass: MinioS3Commands },

    {
      provide: PERMISSIONS_SERVICE,
      // generateProvider function doesn't handle the union type in ApiConfig
      useFactory: (
        apiConfig: ApiConfig,
        systemRequestSignatureProvider: SystemRequestSignatureProvider,
      ) => {
        return new HttpPermissionsService(
          apiConfig,
          systemRequestSignatureProvider,
        );
      },
      inject: [API_CONFIG, SystemRequestSignatureProvider],
    },
  ],
  exports: [],
})
export class FilesContextModule {
  configure(consumer: MiddlewareConsumer) {
    const signedUrlsRoute = `${baseRoute}/${endpointsPaths.getSignedUrls}`;

    consumer
      .apply(SystemRequestValidationMiddleware)
      .exclude(signedUrlsRoute)
      .forRoutes(FilesController)
      .apply(SystemRequestOrSessionValidationMiddleware)
      .forRoutes(signedUrlsRoute);
  }
}
