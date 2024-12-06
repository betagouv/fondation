import crypto from 'crypto';
import { DevApiConfig, ProdApiConfig } from '../zod/api-config-schema';

const baseScalewayDomain = 's3.fr-par.scw.cloud';

export const apiConfig: ProdApiConfig = {
  port: 3000,
  database: {
    connectionString: process.env.DATABASE_URL!,
  },
  contextServices: {
    filesContext: {
      baseUrl: 'http://localhost',
      port: 3000,
    },
  },
  s3: {
    reportsContext: {
      attachedFilesBucketName: process.env.S3_REPORTS_ATTACHED_FILES_BUCKET!,
    },
    scaleway: {
      endpoint: { scheme: 'https', baseDomain: baseScalewayDomain },
      region: 'fr-par',
      encryptionKeyBase64: process.env.SCW_ENCRYPTION_KEY!,
      credentials: {
        accessKeyId: process.env.SCW_ACCESS_KEY!,
        secretAccessKey: process.env.SCW_SECRET_KEY!,
      },
    },
    signedUrlExpiresIn: 60 * 60 * 24,
  },
};

export const defaultApiConfig = {
  port: 3000,
  database: {
    // env variable used by docker compose
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5440,
    user: 'fondation',
    password: 'secret',
    name: 'fondation',
  },
  contextServices: {
    filesContext: {
      baseUrl: 'http://localhost',
      port: 3000,
    },
  },
  s3: {
    reportsContext: {
      attachedFilesBucketName:
        process.env.S3_REPORTS_ATTACHED_FILES_BUCKET ??
        'sandbox-csm-fondation-reports-context',
    },
    minio: {
      endpoint: { scheme: 'http', baseDomain: 'localhost:9000' },
      region: 'eu-west-2',
      encryptionKeyBase64: 'minio-unused-encryption-key',
      credentials: {
        accessKeyId: 'fondation',
        secretAccessKey: 'fondation-secret',
      },
    },
    scaleway: {
      endpoint: { scheme: 'https', baseDomain: baseScalewayDomain },
      region: 'fr-par',
      encryptionKeyBase64: Buffer.from(crypto.randomBytes(32)).toString(
        'base64',
      ),
      credentials: {
        accessKeyId: process.env.SCW_ACCESS_KEY!,
        secretAccessKey: process.env.SCW_SECRET_KEY!,
      },
    },
    signedUrlExpiresIn: 3600,
  },
} satisfies DevApiConfig;
