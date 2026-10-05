import Footer from '@codegouvfr/react-dsfr/Footer';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useMatch } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

const VERSION = import.meta.env.VITE_TAGGED_VERSION;

export function AppFooter() {
  const path = useMatch(ROUTE_PATHS.LOGIN);
  const isLogin = path !== null;

  const contentDescription =
    'Cet outil est réservé au Secrétariat Général du Conseil Supérieur de la Magistrature et à ses membres.';

  return (
    <Footer
      accessibility="non compliant"
      accessibilityLinkProps={{ to: ROUTE_PATHS.ACCESSIBILITY }}
      contentDescription={isLogin ? contentDescription : undefined}
      bottomItems={[
        <span key="anonymousFooter" className={cx('fr-footer__bottom-link')}>
          Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site
          sont proposés sous{' '}
          <a
            href="https://www.apache.org/licenses/LICENSE-2.0"
            target="_blank"
            className="underline! hover:bg-none! hover:no-underline!"
          >
            licence Apache 2.0
          </a>
        </span>,
        ...(VERSION && !isLogin
          ? [
              <span key="appVersion" className={cx('fr-footer__bottom-link')}>
                Version: {VERSION}
              </span>,
            ]
          : []),
      ]}
      domains={isLogin ? undefined : []}
      classes={{
        body: isLogin ? undefined : 'hidden!',
        bottom: isLogin ? undefined : 'mt-0! py-2!',
        bottomCopy: isLogin ? undefined : 'hidden!',
        bottomItem: isLogin ? undefined : 'm-0!',
        bottomList: isLogin ? undefined : 'flex! flex-wrap! items-baseline! justify-center! gap-x-3!',
        root: isLogin ? undefined : 'pt-0! shadow-none!',
      }}
      license={''}
    />
  );
}
