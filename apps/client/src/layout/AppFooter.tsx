import Footer from '@codegouvfr/react-dsfr/Footer';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { FormattedMessage, useIntl } from 'react-intl';
import { useMatch } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

const VERSION = import.meta.env.VITE_TAGGED_VERSION;

export function AppFooter() {
  const { formatMessage } = useIntl();
  const isLogin = useMatch(ROUTE_PATHS.LOGIN) !== null;

  return (
    <Footer
      accessibility="non compliant"
      accessibilityLinkProps={{ to: ROUTE_PATHS.ACCESSIBILITY }}
      bottomItems={[
        <span className={cx('fr-footer__bottom-link')} key="license">
          <FormattedMessage
            defaultMessage="Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site sont proposés sous <link>licence Apache 2.0</link>"
            values={{
              link: (chunks) => (
                <a
                  className="underline! hover:bg-none! hover:no-underline!"
                  href="https://www.apache.org/licenses/LICENSE-2.0"
                  rel="noopener noreferrer"
                  target="_blank"
                  title={formatMessage({ defaultMessage: 'Licence Apache 2.0 - nouvelle fenêtre' })}
                >
                  {chunks}
                </a>
              ),
            }}
          />
        </span>,
        ...(VERSION && !isLogin
          ? [
              <span className={cx('fr-footer__bottom-link')} key="version">
                <FormattedMessage defaultMessage="Version {version}" values={{ version: VERSION }} />
              </span>,
            ]
          : []),
      ]}
      // brandTop and homeLinkProps: the DSFR otherwise borrows them from the header and fails without it
      brandTop="CSM"
      classes={{
        body: isLogin ? undefined : 'hidden!',
        bottom: isLogin ? undefined : 'mt-0! py-2!',
        bottomCopy: isLogin ? undefined : 'hidden!',
        bottomItem: isLogin ? undefined : 'm-0!',
        bottomList: isLogin ? undefined : 'flex! flex-wrap! items-baseline! justify-center! gap-x-3!',
        root: isLogin ? undefined : 'pt-0! shadow-none!',
      }}
      contentDescription={
        isLogin
          ? formatMessage({
              defaultMessage:
                'Cet outil est réservé au Secrétariat Général du Conseil Supérieur de la Magistrature et à ses membres.',
            })
          : undefined
      }
      domains={isLogin ? undefined : []}
      homeLinkProps={{ title: formatMessage({ defaultMessage: 'Accueil' }), to: '/' }}
      license=""
    />
  );
}
