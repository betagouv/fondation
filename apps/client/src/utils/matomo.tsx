import {
  createInstance,
  MatomoProvider as RootMatomoProvider,
  useMatomo,
} from '@datapunt/matomo-tracker-react';
import { useEffect, type PropsWithChildren } from 'react';
import { useLocation } from 'react-router';

const matomoConfig = {
  baseUrl: import.meta.env.VITE_MATOMO_BASE_URL ?? '',
  siteId: Number(import.meta.env.VITE_MATOMO_SITE_ID),
};

const isMatomoEnabled = matomoConfig.baseUrl && Number.isFinite(matomoConfig.siteId);

const instance = isMatomoEnabled
  ? createInstance({
      disabled: !isMatomoEnabled,
      siteId: matomoConfig.siteId,
      urlBase: matomoConfig.baseUrl ?? '',

      configurations: {
        disableCookies: true,
        trackPageView: false,
      },
    })
  : undefined;

export function MatomoProvider({ children }: PropsWithChildren) {
  // @ts-expect-error: there seems to be a bug in the type definition --"
  return <RootMatomoProvider value={instance}>{children}</RootMatomoProvider>;
}

export function useMatomoPageTracking() {
  const matomo = useMatomo();
  const location = useLocation();

  useEffect(() => {
    let title: string | undefined;
    for (const i of [1, 2, 3]) {
      const $title = document.body.querySelector<HTMLHeadingElement>(`h${i}`);
      if (!$title) continue;

      title = $title.innerText;
    }

    if (title) matomo.pushInstruction('setDocumentTitle', title);

    matomo.pushInstruction('trackPageView');
  }, [matomo, location]);
}

export function identifyUser(user: { id: string; role: string }): void {
  // FIXME: this might not be compatible with tracking without consent:
  // https://fr.matomo.org/faq/how-do-i-use-matomo-analytics-without-consent-or-cookie-banner/#comment-configurer-matomo-pour-une-protection-de-la-vie-privee-sans-consentement
  instance?.pushInstruction('setUserId', user.id);

  instance?.enableLinkTracking(true);
}

export function resetUser(): void {
  instance?.enableLinkTracking(false);
  instance?.pushInstruction('resetUserId');
}
