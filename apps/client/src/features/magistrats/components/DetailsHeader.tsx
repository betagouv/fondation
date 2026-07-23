import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router';

import { TitleNameIcons } from '@/shared/components/title-name-icons';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedMagistratDto } from '@api/types';

type DetailsHeaderProps = {
  context: 'sg' | 'membre';
  magistrat: DetailedMagistratDto;
};

export function DetailsHeader({ context, magistrat }: DetailsHeaderProps) {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const dashboardPath = context === 'sg' ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD;

  const segments =
    context === 'sg'
      ? [
          {
            label: formatMessage({ defaultMessage: 'Secrétariat général' }),
            to: ROUTE_PATHS.SG.DASHBOARD,
          },
        ]
      : [
          {
            label: formatMessage({ defaultMessage: 'Transparences' }),
            to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
          },
          {
            label: formatMessage({
              defaultMessage: 'Pouvoir de proposition du garde des Sceaux',
            }),
            to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
          },
        ];

  const goBack = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.history.length > 1) {
      event.preventDefault();
      navigate(-1);
    }
  };

  return (
    <>
      <Breadcrumb
        ariaLabel={formatMessage({
          defaultMessage: "Fil d'Ariane de la fiche magistrat",
        })}
        breadcrumb={{
          currentPageLabel: formatMessage({
            defaultMessage: 'Fiche magistrat',
          }),
          segments,
        }}
        className="fr-my-0"
        id="magistrat-details-breadcrumb"
      />
      <div className="fr-mt-4v fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-lg-4">
          <Link
            className="fr-link fr-link--icon-left fr-icon-arrow-left-line fr-mt-1v"
            onClick={goBack}
            to={dashboardPath}
          >
            <FormattedMessage defaultMessage="Retour" />
          </Link>
        </div>
        <div className="fr-col-12 fr-col-lg-8">
          <p className="fr-text--lg fr-mb-2v font-medium text-(--text-title-blue-france)">
            <FormattedMessage defaultMessage="Fiche magistrat" />
          </p>
          <h1 className="fr-h2 fr-mb-0">
            <TitleNameIcons
              lolfi={{ href: magistrat.externalUrl }}
              name={`${magistrat.civilite} ${magistrat.lastName.toUpperCase()} ${magistrat.firstName}`}
              small
            />
          </h1>
        </div>
      </div>
    </>
  );
}
