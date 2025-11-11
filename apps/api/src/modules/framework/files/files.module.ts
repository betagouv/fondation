import { S3Client } from '@aws-sdk/client-s3';
import {
  Module,
  type DynamicModule,
  type InjectionToken,
} from '@nestjs/common';

import { API_CONFIG_TOKEN, type ApiConfig } from 'src/modules/framework/config';
import { PrismaService } from 'src/modules/framework/database';

import { Files } from './files';
import { FilesCoreModule, SSE_CONFIG_TOKEN } from './files-core.module';

@Module({})
export class FilesModule {
  private static readonly tokens = new Set<InjectionToken<Files>>();

  static forRoot(): DynamicModule {
    return {
      module: FilesModule,
      imports: [FilesCoreModule],
    };
  }

  static forFeature(bucket: 'reports' | 'nominations'): DynamicModule {
    const token = `Files_${bucket}`;
    if (this.tokens.has(token)) {
      throw new Error(`${bucket} feature was created twice in the app`);
    }

    this.tokens.add(token);

    return {
      module: FilesModule,
      exports: [Files],
      providers: [
        {
          provide: token,
          inject: [S3Client, PrismaService, API_CONFIG_TOKEN, SSE_CONFIG_TOKEN],
          useFactory: (
            client: S3Client,
            prisma: PrismaService,
            config: ApiConfig,
            sseConfig: { base64Key: string; algorithm: 'AES256' } | undefined,
          ) => {
            // TODO:
            //  - we don't really care to have a different bucket per context
            //  - we could have the same buckets names per environment for simplicity
            const bucketName =
              bucket === 'reports'
                ? config.s3.reportsContext.attachedFilesBucketName
                : config.s3.nominationsContext.transparencesBucketName;

            return new Files(client, prisma, bucketName, config, sseConfig);
          },
        },
        { provide: Files, useExisting: token },
      ],
    };
  }
}
