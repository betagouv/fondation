import { z } from 'zod';

export enum DeployEnvMode {
  PRODUCTION = 'production',
  STAGING = 'staging',
}

const commonBaseSchema = z.object({
  port: z.number(),
  cookieSecret: z.string().min(32),
  cookieMaxAgeInMs: z.number().positive(),
  sharedSecret: z.string().min(32),
  contextServices: z.object({
    filesContext: z.object({
      baseUrl: z.string(),
    }),
    identityAndAccessContext: z.object({
      baseUrl: z.string(),
    }),
  }),
});

const commonS3Schema = z.object({
  reportsContext: z.object({
    attachedFilesBucketName: z.string(),
  }),
  nominationsContext: z.object({
    transparenceFilesBucketName: z.string(),
  }),
  signedUrlExpiresIn: z.number(),
});

const S3ConfigSchema = z.object({
  endpoint: z.object({
    scheme: z.enum(['http', 'https']),
    baseDomain: z.string(),
  }),
  region: z.string(),
  encryptionKeyBase64: z.string(),
  credentials: z.object({
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
  }),
});

export const ProdApiConfigSchema = commonBaseSchema.merge(
  z.object({
    originUrl: z.string().url().startsWith('https://'),
    frontendOriginUrl: z.string().url().startsWith('https://'),
    sentryDsn: z.string().url(),
    deployEnv: z.nativeEnum(DeployEnvMode),
    database: z.object({
      connectionString: z.string(),
    }),
    s3: commonS3Schema.merge(
      z.object({
        scaleway: S3ConfigSchema,
      }),
    ),
  }),
);

export const DevApiConfigSchema = commonBaseSchema.merge(
  z.object({
    originUrl: z.string().url().startsWith('http://'),
    frontendOriginUrl: z.string().url().startsWith('http://'),
    database: z.object({
      host: z.string(),
      port: z.number(),
      user: z.string(),
      password: z.string(),
      name: z.string(),
    }),
    s3: commonS3Schema.merge(
      z.object({
        minio: S3ConfigSchema,
        scaleway: S3ConfigSchema,
      }),
    ),
  }),
);

export type S3Config = z.infer<typeof S3ConfigSchema>;

export type ProdApiConfig = z.infer<typeof ProdApiConfigSchema>;
export type DevApiConfig = z.infer<typeof DevApiConfigSchema>;
export type ApiConfig = ProdApiConfig | DevApiConfig;
