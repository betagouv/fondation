interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FAKE_USERS: string;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
