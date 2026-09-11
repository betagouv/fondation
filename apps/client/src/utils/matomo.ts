import { useEffect } from 'react';
import { useLocation, useMatches, type UIMatch } from 'react-router';
import { z } from 'zod';

declare global {
  interface Window {
    _paq?: unknown[][];
  }
}

const matomoConfigSchema = z.object({
  baseUrl: z.url().transform((url) => (url.endsWith('/') ? url : `${url}/`)),
  siteId: z.coerce.number().int().positive(),
});

export class MatomoTracker {
  #previousUrl: string | undefined;

  constructor(private readonly config: z.infer<typeof matomoConfigSchema>) {}

  static fromEnv(
    env: Pick<ImportMetaEnv, 'VITE_MATOMO_BASE_URL' | 'VITE_MATOMO_SITE_ID'>,
  ): MatomoTracker | undefined {
    const config = matomoConfigSchema.safeParse({
      baseUrl: env.VITE_MATOMO_BASE_URL,
      siteId: env.VITE_MATOMO_SITE_ID,
    });
    return config.success ? new MatomoTracker(config.data) : undefined;
  }

  start(): void {
    this.push('setTrackerUrl', `${this.config.baseUrl}matomo.php`);
    this.push('setSiteId', this.config.siteId);
    this.push('disableCookies');
    this.push('enableHeartBeatTimer');
    this.push('enableLinkTracking');

    const script = document.createElement('script');
    script.async = true;
    script.src = `${this.config.baseUrl}matomo.js`;
    document.head.appendChild(script);
  }

  trackPageView(page: { title: string; url: string }): void {
    if (this.#previousUrl) this.push('setReferrerUrl', this.#previousUrl);
    this.push('setCustomUrl', page.url);
    this.push('setDocumentTitle', page.title);
    this.push('trackPageView');
    this.#previousUrl = page.url;
  }

  private push(...instruction: unknown[]): void {
    (window._paq ??= []).push(instruction);
  }
}

export const matomo = MatomoTracker.fromEnv(import.meta.env);

export function routePattern(match: Pick<UIMatch, 'params' | 'pathname'>): string {
  return Object.entries(match.params).reduce(
    (pattern, [name, value]) => (value ? pattern.replace(value, `:${name}`) : pattern),
    match.pathname,
  );
}

export function useMatomoPageTracking(): void {
  const { pathname } = useLocation();
  const matches = useMatches();
  const page = routePattern(matches[matches.length - 1] ?? { params: {}, pathname });

  useEffect(() => {
    const title = document.querySelector('h1')?.innerText ?? document.title;
    matomo?.trackPageView({ title, url: `${window.location.origin}${page}` });
  }, [page, pathname]);
}
