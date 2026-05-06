import Footer from '@codegouvfr/react-dsfr/Footer';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useMatch } from 'react-router';

const VERSION = import.meta.env.VITE_TAGGED_VERSION;
export const AppFooter = () => {
  const path = useMatch(ROUTE_PATHS.LOGIN);
  const isLogin = path !== null;

  const contentDescription =
    'Cet outil est réservé aux Secrétariat Général du Conseil Supérieur de la Magistrature et à ses membres.';

  return (
    <Footer
      accessibility="non compliant"
      contentDescription={isLogin ? contentDescription : undefined}
      bottomItems={[
        <span key="anonymousFooter" className={cx('fr-footer__bottom-link')}>
          Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site
          sont proposés sous{' '}
          <a
            href="https://www.apache.org/licenses/LICENSE-2.0"
            target="_blank"
            className="underline hover:no-underline"
          >
            licence Apache 2.0
          </a>
        </span>,
        ...(VERSION && !isLogin
          ? [
              <span key="appVersion" className={cx('fr-footer__bottom-link')}>
                Version: {VERSION}
              </span>
            ]
          : [])
      ]}
      domains={isLogin ? undefined : []}
      classes={{
        root: isLogin ? undefined : 'shadow-none',
        body: isLogin ? undefined : 'hidden',
        bottomList: isLogin ? undefined : ''
      }}
      license={''}
    />
  );
};
