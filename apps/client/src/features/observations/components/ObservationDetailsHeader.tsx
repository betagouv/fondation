import { FormattedMessage, useIntl } from 'react-intl';

import { DetailsLink } from '@/shared/components/details-link';
import { LolfiLink } from '@/shared/components/lolfi-link';
import { TitleNameIcons } from '@/shared/components/title-name-icons';
import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsHeader } from '@/shared/ui/details';
import { useMemberBreadcrumbRoot } from '@/utils/transparences-breadcrumb.utils';
import type { GetObservationDetailsResponseDto } from '@api/types';

import { ObservationFollowUpSelector } from './ObservationFollowUpSelector';
import { ObservationFollowUpTag } from './ObservationFollowUpTag';

export function ObservationDetailsHeader(props: {
  backTo: string;
  context: 'sg' | 'membre';
  nominationFileId: string;
  observation: GetObservationDetailsResponseDto;
  sessionId: string;
}) {
  const { formatMessage } = useIntl();
  const breadcrumbRoot = useBreadcrumbRoot();
  const { canEdit, followUp, followUpComment, observant } = props.observation;

  const memberRoot = useMemberBreadcrumbRoot();
  const segments = props.context === 'sg' ? breadcrumbRoot : memberRoot;

  return (
    <DetailsHeader
      action={
        (canEdit || followUp) && (
          <div>
            {canEdit ? (
              <ObservationFollowUpSelector
                followUp={followUp}
                nominationFileId={props.nominationFileId}
                observationId={props.observation.id}
                sessionId={props.sessionId}
              />
            ) : (
              followUp && <ObservationFollowUpTag followUp={followUp} />
            )}
            {followUpComment && (
              <p className="fr-mt-2v fr-mb-0 fr-p-0 text-sm font-normal italic">{followUpComment}</p>
            )}
          </div>
        )
      }
      backTo={props.backTo}
      backThroughHistory
      breadcrumb={
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de l'observation" })}
          breadcrumb={{ currentPageLabel: formatMessage({ defaultMessage: 'Observation' }), segments }}
          className="fr-mt-0"
          id="observation-details-breadcrumb"
        />
      }
      overline={<FormattedMessage defaultMessage="Observation" />}
      title={
        <TitleNameIcons name={observant.name}>
          <DetailsLink context={props.context} magistratId={observant.id} small />
          <LolfiLink href={observant.externalUrl} small />
        </TitleNameIcons>
      }
    />
  );
}
