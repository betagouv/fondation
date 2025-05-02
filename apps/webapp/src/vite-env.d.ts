interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FAKE_USERS: string;
  readonly VITE_GDS_TRANSPA_FILES_IDS: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_DEPLOY_ENV: string;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
