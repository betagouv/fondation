import type { HeaderProps } from '@codegouvfr/react-dsfr/Header';
import { useIntl } from 'react-intl';

/** the brand every header shows, whether it reads the user's data or not */
export function useHeaderBrand() {
  const { formatMessage } = useIntl();

  return {
    brandTop: 'CSM',
    homeLinkProps: { title: formatMessage({ defaultMessage: 'Accueil' }), to: '/', viewTransition: true },
    operatorLogo: {
      alt: formatMessage({ defaultMessage: 'Conseil Supérieur de la Magistrature' }),
      imgUrl: '/logo.png',
      orientation: 'horizontal',
    },
    serviceTitle: 'Fondation',
  } satisfies Partial<HeaderProps>;
}
