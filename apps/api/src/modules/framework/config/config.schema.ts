import { z } from 'zod';

export const ConfigSchema = z.object({
  isProduction: z.prefault(z.boolean(), process.env.NODE_ENV === 'production'),

  appName: z.string().default('fondation-api'),
  appVersion: z.prefault(z.string().optional(), process.env.APP_VERSION),

  port: z.prefault(z.number(), Number(process.env.PORT) || 3000),

  cookieSecret: z.prefault(z.string().min(32), process.env.COOKIE_SECRET!),

  originUrl: z.prefault(z.url().regex(/[^\/]$/), process.env.ORIGIN_URL!),

  frontendOriginUrl: z.prefault(
    z.url().regex(/[^\/]$/),
    process.env.FRONTEND_ORIGIN_URL!,
  ),

  e2eApiToken: z
    .prefault(z.string().trim().nonempty().nullish(), process.env.E2E_API_TOKEN)
    .transform((x) => (process.env.NODE_ENV === 'production' ? null : x)),

  sentryDsn: z.prefault(z.url().optional(), process.env.SENTRY_DSN),

  databaseUrl: z.prefault(
    z.url().startsWith('postgresql://'),
    process.env.DATABASE_URL!,
  ),

  lolfi: z.preprocess(
    () => ({}),
    z.object({
      privateKeyPath: z.prefault(
        z.string().trim().nonempty().optional(),
        process.env.LOLFI_CRYPTO_PRIVKEY_PATH,
      ),
    }),
  ),

  apiTokens: z.prefault(
    z
      .string()
      .transform((x) =>
        x
          .split(',')
          .map((x) => x.trim())
          .filter((x) => !!x),
      )
      .pipe(z.array(z.string().nonempty())),
    process.env.INBOUND_ALLOWED_API_TOKENS ?? '',
  ),

  chromiumExecutablePath: z.prefault(
    z.string().optional(),
    process.env.CHROMIUM_EXECUTABLE_PATH,
  ),

  scalingo: z.preprocess(
    () => ({}),
    z.object({
      appName: z.prefault(z.string().optional(), process.env.SCALINGO_APP_NAME),
      apiKey: z.prefault(z.string().optional(), process.env.SCALINGO_API_KEY),
    }),
  ),

  mattermostWebhook: z.prefault(
    z.url().nullish(),
    process.env.MATTERMOST_WEBHOOK,
  ),

  s3: z.preprocess(
    () => ({}),
    z.object({
      bucket: z.prefault(
        z.string(),
        process.env.S3_BUCKET ||
          /** @deprecated */ process.env.S3_REPORTS_ATTACHED_FILES_BUCKET!,
      ),

      region: z.prefault(z.string(), process.env.S3_REGION || 'fr-par'),

      signedUrlDurationSeconds: z.prefault(z.number(), 3_600),

      credentials: z.preprocess(
        () => ({}),
        z.object({
          accessKeyId: z.prefault(
            z.string(),
            process.env.S3_ACCESS_KEY ||
              /** @deprecated */ process.env.SCW_ACCESS_KEY!,
          ),
          secretAccessKey: z.prefault(
            z.string(),
            process.env.S3_SECRET_KEY ||
              /** @deprecated */ process.env.SCW_SECRET_KEY!,
          ),
        }),
      ),

      forcePathStyle: z.prefault(
        z.boolean(),
        process.env.S3_FORCE_PATH_STYLE === 'true',
      ),

      endpoint: z.prefault(
        process.env.NODE_ENV === 'production'
          ? z
              .url()
              .startsWith('https://')
              .regex(/[^\/]$/)
          : z.url().regex(/[^\/]$/),
        process.env.S3_ENDPOINT || 'https://s3.fr-par.scw.cloud',
      ),

      encryptionKeyBase64:
        process.env.NODE_ENV === 'production'
          ? z.prefault(
              z.string(),
              process.env.S3_ENCRYPTION_KEY ||
                /** @deprecated */ process.env.SCW_ENCRYPTION_KEY!,
            )
          : z.undefined(),
    }),
  ),
});

export type ApiConfig = z.infer<typeof ConfigSchema>;
