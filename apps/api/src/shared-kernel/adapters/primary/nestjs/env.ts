import crypto from 'crypto';
import {
  DeployEnvMode,
  DevApiConfig,
  ProdApiConfig,
} from '../zod/api-config-schema';

const baseScalewayDomain = 's3.fr-par.scw.cloud';

// The DNS will resolve this url to a private IP.
// APP env variable is set by scalingo.
const baseUrl = `http://${process.env.APP}.osc-secnum-fr1.scalingo.io`;

export const apiConfig: ProdApiConfig = {
  originUrl: process.env.ORIGIN_URL!,
  frontendOriginUrl: process.env.FRONTEND_ORIGIN_URL!,
  sentryDsn: process.env.SENTRY_DSN!,
  deployEnv:
    (process.env.DEPLOY_ENV as DeployEnvMode) || DeployEnvMode.PRODUCTION,
  port: 3000,
  cookieSecret: process.env.COOKIE_SECRET!,
  cookieMaxAgeInMs: Number(process.env.COOKIE_MAX_AGE_IN_MS!),
  database: {
    connectionString: process.env.DATABASE_URL!,
  },
  contextServices: {
    filesContext: {
      baseUrl,
    },
    identityAndAccessContext: {
      baseUrl,
    },
  },
  s3: {
    reportsContext: {
      attachedFilesBucketName: process.env.S3_REPORTS_ATTACHED_FILES_BUCKET!,
    },
    nominationsContext: {
      transparencesBucketName: process.env.S3_TRANSPARENCES_BUCKET!,
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
  sharedSecret: process.env.SHARED_SECRET!,
};

const defaultBaseUrl = 'http://localhost:3000';

export const defaultApiConfig = {
  originUrl: 'http://localhost:3000',
  frontendOriginUrl: 'http://localhost:5174',
  port: 3000,
  cookieSecret: process.env.COOKIE_SECRET!,
  cookieMaxAgeInMs: 1000 * 60 * 60 * 24 * 90,
  database: {
    // env variable used by docker compose
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5441,
    user: 'fondation',
    password: 'secret',
    name: 'fondation',
  },
  contextServices: {
    filesContext: {
      baseUrl: defaultBaseUrl,
    },
    identityAndAccessContext: {
      baseUrl: defaultBaseUrl,
    },
  },
  s3: {
    reportsContext: {
      attachedFilesBucketName:
        process.env.S3_REPORTS_ATTACHED_FILES_BUCKET ??
        'sandbox-csm-fondation-reports-context',
    },
    nominationsContext: {
      transparencesBucketName:
        process.env.S3_TRANSPARENCES_BUCKET ??
        'sandbox-csm-fondation-transparences-context',
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
      encryptionKeyBase64:
        process.env.SCW_ENCRYPTION_KEY ??
        Buffer.from(crypto.randomBytes(32)).toString('base64'),
      credentials: {
        accessKeyId: process.env.SCW_ACCESS_KEY!,
        secretAccessKey: process.env.SCW_SECRET_KEY!,
      },
    },
    signedUrlExpiresIn: 3600,
  },
  sharedSecret:
    process.env.SHARED_SECRET ??
    'very-very-very-very-very-very-long-shared-secret',
} satisfies DevApiConfig;
