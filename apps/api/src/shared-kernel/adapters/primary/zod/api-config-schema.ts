import { z } from 'zod';

const commonBaseSchema = z.object({
  port: z.number(),
  contextServices: z.object({
    filesContext: z.object({
      baseUrl: z.string(),
    }),
  }),
});

const commonS3Schema = z.object({
  reportsContext: z.object({
    attachedFilesBucketName: z.string(),
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
