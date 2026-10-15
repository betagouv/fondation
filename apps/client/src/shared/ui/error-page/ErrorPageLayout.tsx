import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import TechnicalError from '@codegouvfr/react-dsfr/picto/TechnicalError';
import type { ComponentType, ReactNode } from 'react';

import { OvoidBackground, OvoidMotif } from '@/shared/ui/ovoid';

/** @see https://www.systeme-de-design.gouv.fr/version-courante/fr/modeles/pages-types/page-d-erreurs */
export function ErrorPageLayout(props: {
  children: ReactNode;
  pictogram?: ComponentType<{ 'aria-hidden': boolean; className: string; height: string; width: string }>;
}) {
  const Pictogram = props.pictogram ?? TechnicalError;

  return (
    <div className="fr-container">
      <div
        className={cx(
          'fr-my-14v',
          'fr-mt-md-24v',
          'fr-mb-md-20v',
          'fr-grid-row',
          'fr-grid-row--gutters',
          'fr-grid-row--middle',
          'fr-grid-row--center',
        )}
      >
        <div className={cx('fr-py-0', 'fr-col-12', 'fr-col-md-6')}>{props.children}</div>

        <div
          className={cx(
            'fr-col-12',
            'fr-col-md-3',
            'fr-col-offset-md-1',
            'fr-px-12v',
            'fr-px-md-0',
            'fr-py-0',
          )}
        >
          <div className="relative h-50 w-40">
            <OvoidMotif className="absolute" />
            <OvoidBackground className="fr-artwork-background absolute" />

            <Pictogram
              aria-hidden
              className="fr-artwork fr-responsive-img absolute"
              height="100"
              width="80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
