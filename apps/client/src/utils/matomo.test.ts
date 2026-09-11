import { beforeEach, describe, expect, it } from 'vitest';

import { MatomoTracker, routePattern } from './matomo';

describe('MatomoTracker.fromEnv', () => {
  it('is disabled without a base url', () => {
    expect(
      MatomoTracker.fromEnv({ VITE_MATOMO_BASE_URL: undefined, VITE_MATOMO_SITE_ID: '3' }),
    ).toBeUndefined();
    expect(MatomoTracker.fromEnv({ VITE_MATOMO_BASE_URL: '', VITE_MATOMO_SITE_ID: '3' })).toBeUndefined();
  });

  it('is disabled without a strictly positive site id', () => {
    const VITE_MATOMO_BASE_URL = 'https://stats.example.fr';
    expect(MatomoTracker.fromEnv({ VITE_MATOMO_BASE_URL, VITE_MATOMO_SITE_ID: undefined })).toBeUndefined();
    expect(MatomoTracker.fromEnv({ VITE_MATOMO_BASE_URL, VITE_MATOMO_SITE_ID: '' })).toBeUndefined();
    expect(MatomoTracker.fromEnv({ VITE_MATOMO_BASE_URL, VITE_MATOMO_SITE_ID: '0' })).toBeUndefined();
    expect(MatomoTracker.fromEnv({ VITE_MATOMO_BASE_URL, VITE_MATOMO_SITE_ID: 'abc' })).toBeUndefined();
  });

  it('is enabled with a valid configuration', () => {
    expect(
      MatomoTracker.fromEnv({ VITE_MATOMO_BASE_URL: 'https://stats.example.fr', VITE_MATOMO_SITE_ID: '3' }),
    ).toBeInstanceOf(MatomoTracker);
  });
});

describe('MatomoTracker', () => {
  beforeEach(() => {
    window._paq = [];
    document.head.querySelectorAll('script').forEach((script) => script.remove());
  });

  it('configures the tracker and loads the script on start', () => {
    const tracker = MatomoTracker.fromEnv({
      VITE_MATOMO_BASE_URL: 'https://stats.example.fr/matomo',
      VITE_MATOMO_SITE_ID: '3',
    });
    tracker?.start();

    expect(window._paq).toEqual([
      ['setTrackerUrl', 'https://stats.example.fr/matomo/matomo.php'],
      ['setSiteId', 3],
      ['disableCookies'],
      ['enableHeartBeatTimer'],
      ['enableLinkTracking'],
    ]);
    expect(document.head.querySelector('script')?.src).toBe('https://stats.example.fr/matomo/matomo.js');
  });

  it('tracks a page view with its url and title, then chains the referrer', () => {
    const tracker = MatomoTracker.fromEnv({
      VITE_MATOMO_BASE_URL: 'https://stats.example.fr',
      VITE_MATOMO_SITE_ID: '3',
    });
    tracker?.trackPageView({ title: 'Synthèse', url: 'https://app.example.fr/synthese' });
    tracker?.trackPageView({ title: 'Magistrat', url: 'https://app.example.fr/magistrats/:magistratId' });

    expect(window._paq).toEqual([
      ['setCustomUrl', 'https://app.example.fr/synthese'],
      ['setDocumentTitle', 'Synthèse'],
      ['trackPageView'],
      ['setReferrerUrl', 'https://app.example.fr/synthese'],
      ['setCustomUrl', 'https://app.example.fr/magistrats/:magistratId'],
      ['setDocumentTitle', 'Magistrat'],
      ['trackPageView'],
    ]);
  });
});

describe('routePattern', () => {
  it('keeps a static path as is', () => {
    expect(routePattern({ params: {}, pathname: '/synthese' })).toBe('/synthese');
  });

  it('replaces every param value by its name', () => {
    expect(
      routePattern({
        params: { nominationFileId: 'f1', observationId: 'o1', sessionId: 's1' },
        pathname: '/sessions/s1/dossiers/f1/observations/o1',
      }),
    ).toBe('/sessions/:sessionId/dossiers/:nominationFileId/observations/:observationId');
  });
});
