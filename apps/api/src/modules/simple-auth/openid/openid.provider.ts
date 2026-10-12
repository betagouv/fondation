/**
 * Union of every OpenID client id registered in the application.
 * Extend it with each new provider, e.g. `'pro-connect' | 'google'`.
 */
export const OPENID_PROVIDERS = ['pro-connect'] as const;

export type OpenIdProvider = (typeof OPENID_PROVIDERS)[number];
