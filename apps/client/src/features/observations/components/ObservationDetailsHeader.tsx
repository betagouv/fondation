import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router';

import { DetailsLink } from '@/shared/components/details-link';
import { LolfiLink } from '@/shared/components/lolfi-link';
import { TitleNameIcons } from '@/shared/components/title-name-icons';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsHeader } from '@/shared/ui/details';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { fullNameCapitalized } from '@/utils/user.utils';
import type { GetObservationDetailsResponseDto } from '@api/types';

import { ObservationFollowUpSelector } from './ObservationFollowUpSelector';

export function ObservationDetailsHeader(props: {
  backTo: string;
  context: 'sg' | 'membre';
  isArchived: boolean;
  nominationFileId: string;
  observation: GetObservationDetailsResponseDto;
  sessionId: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { observant } = props.observation;

  const segments =
    props.context === 'sg'
      ? [{ label: formatMessage({ defaultMessage: 'Secrétariat général' }), to: ROUTE_PATHS.SG.DASHBOARD }]
      : [
          {
            label: formatMessage({ defaultMessage: 'Transparences' }),
            to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
          },
          {
            label: formatMessage({ defaultMessage: 'Pouvoir de proposition du garde des Sceaux' }),
            to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
          },
        ];

  const goBack = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const hasPreviousPage = location.key !== 'default';
    if (hasPreviousPage) {
      event.preventDefault();
      navigate(-1);
    }
  };

  return (
    <DetailsHeader
      action={
        <ObservationFollowUpSelector
          comment={props.observation.followUpComment}
          followUp={props.observation.followUp}
          isArchived={props.isArchived}
          nominationFileId={props.nominationFileId}
          observationId={props.observation.id}
          sessionId={props.sessionId}
        />
      }
      backTo={props.backTo}
      breadcrumb={
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de l'observation" })}
          breadcrumb={{ currentPageLabel: formatMessage({ defaultMessage: 'Observation' }), segments }}
          className="fr-mt-0"
          id="observation-details-breadcrumb"
        />
      }
      onBackClick={goBack}
      overline={<FormattedMessage defaultMessage="Observation" />}
      title={
        <TitleNameIcons name={fullNameCapitalized(observant)}>
          <DetailsLink context={props.context} magistratId={observant.id} small />
          <LolfiLink href={observant.externalUrl} small />
        </TitleNameIcons>
      }
    />
  );
}
