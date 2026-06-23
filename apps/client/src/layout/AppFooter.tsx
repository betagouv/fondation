import Footer from '@codegouvfr/react-dsfr/Footer';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import React from 'react';
import { useIntl } from 'react-intl';
import { useMatch } from 'react-router';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

const VERSION = import.meta.env.VITE_TAGGED_VERSION;

function JdmaButton() {
  const { formatMessage } = useIntl();
  const isSg = useIsSg(true);
  const url = React.useMemo(() => {
    switch (isSg) {
      case true:
        return import.meta.env.VITE_JDMA_URL_AGENT;
      case false:
        return import.meta.env.VITE_JDMA_URL_MEMBER;
      default:
        return undefined;
    }
  }, [isSg]);

  if (!url) return null;
  return (
    <div className="fr-mb-1v text-center">
      <a
        key="jeDonneMonAvisLink"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={formatMessage({ defaultMessage: 'Je donne mon avis - nouvelle fenêtre' })}
        className="bg-none bg-auto bg-top-left after:hidden"
      >
        <img
          className="w-24"
          src="https://jedonnemonavis.numerique.gouv.fr/static/bouton-bleu-clair.svg"
          alt={formatMessage({ defaultMessage: 'Je donne mon avis' })}
        />
      </a>
    </div>
  );
}

export function AppFooter() {
  const path = useMatch(ROUTE_PATHS.LOGIN);
  const isLogin = path !== null;

  const contentDescription =
    'Cet outil est réservé au Secrétariat Général du Conseil Supérieur de la Magistrature et à ses membres.';

  return (
    <>
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
          root: isLogin ? undefined : 'shadow-none!',
          body: isLogin ? undefined : 'hidden!',
          bottomList: isLogin ? undefined : '',
        }}
        license={''}
      />
      {!isLogin && <JdmaButton />}
    </>
  );
}
