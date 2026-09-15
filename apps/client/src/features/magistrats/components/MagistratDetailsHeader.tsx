import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

import { LolfiLink } from '@/shared/components/lolfi-link';
import { TitleNameIcons } from '@/shared/components/title-name-icons';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsHeader } from '@/shared/ui/details';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import { fullNameCapitalized } from '@/utils/user.utils';
import type { DetailedMagistratDto } from '@api/types';

type MagistratDetailsHeaderProps = {
  context: 'sg' | 'membre';
  magistrat: DetailedMagistratDto;
};

export function MagistratDetailsHeader({ context, magistrat }: MagistratDetailsHeaderProps) {
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
    <DetailsHeader
      backTo={dashboardPath}
      breadcrumb={
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
      }
      onBackClick={goBack}
      overline={<FormattedMessage defaultMessage="Fiche magistrat" />}
      title={
        <TitleNameIcons
          name={`${capitalize(magistrat.civilite.toLowerCase())} ${fullNameCapitalized(magistrat)}`}
        >
          <LolfiLink href={magistrat.externalUrl} small />
        </TitleNameIcons>
      }
    />
  );
}
