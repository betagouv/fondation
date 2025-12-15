import { S3Client } from '@aws-sdk/client-s3';
import { Module, type DynamicModule } from '@nestjs/common';

import { API_CONFIG_TOKEN, type ApiConfig } from 'src/modules/framework/config';
import { PrismaService } from 'src/modules/framework/database';

import { Files } from './files';
import { FilesCoreModule, SSE_CONFIG_TOKEN } from './files-core.module';
import { StoreFileInterceptor } from './multipart/store-file.interceptor';

@Module({})
export class FilesModule {
  static forRoot(): DynamicModule {
    return {
      module: FilesModule,
      imports: [FilesCoreModule],
      exports: [Files],
      providers: [
        StoreFileInterceptor,
        {
          provide: Files,
          inject: [S3Client, PrismaService, API_CONFIG_TOKEN, SSE_CONFIG_TOKEN],
          useFactory: (
            client: S3Client,
            prisma: PrismaService,
            config: ApiConfig,
            sseConfig: { base64Key: string; algorithm: 'AES256' } | undefined,
          ) => {
            const bucketName = config.s3.reportsContext.attachedFilesBucketName;
            return new Files(client, prisma, bucketName, config, sseConfig);
          },
        },
      ],
    };
  }
}
