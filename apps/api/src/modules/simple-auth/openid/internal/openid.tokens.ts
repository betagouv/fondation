import { OpenIdProvider } from '../openid.provider';

export const internalOpenIdTokens = {
  client: (id: OpenIdProvider) => `OPENID_CLIENT:${String(id)}`,
  config: (id: OpenIdProvider) => `OPENID_CONFIG:${String(id)}`,
  userOptions: (id: OpenIdProvider) => `OPENID_USER_OPTIONS:${String(id)}`,
};
