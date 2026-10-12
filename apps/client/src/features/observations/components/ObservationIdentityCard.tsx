import type React from 'react';
import { FormattedMessage } from 'react-intl';

import { BiographyList } from '@/shared/components/biography-list';
import { DetailsLink } from '@/shared/components/details-link';
import { LolfiLink } from '@/shared/components/lolfi-link';
import { TitleNameIcons } from '@/shared/components/title-name-icons';
import { DetailsCard } from '@/shared/ui/details';
import { formatDateOnly } from '@/utils/date-only.util';
import type { GetObservationDetailsResponseDto } from '@api/types';

export function ObservationIdentityCard(props: {
  context: 'sg' | 'membre';
  nominationFileId: string;
  observation: GetObservationDetailsResponseDto;
  sessionId: string;
}) {
  const { observant, observedMagistrat, receptionDate } = props.observation;

  return (
    <DetailsCard>
      <h2 className="fr-h4">
        <FormattedMessage defaultMessage="Résumé" />
      </h2>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 p-0">
        <InfoItem label={<FormattedMessage defaultMessage="Date de réception" />}>
          {formatDateOnly(receptionDate)}
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Magistrat observé" />}>
          <TitleNameIcons name={observedMagistrat.name}>
            <DetailsLink
              className="-my-1"
              context={props.context}
              magistratId={observedMagistrat.detectedMagistratId}
              small
            />
            <LolfiLink
              className="-my-1"
              name={observedMagistrat.name}
              nominationFileId={props.nominationFileId}
              sessionId={props.sessionId}
              small
            />
          </TitleNameIcons>
        </InfoItem>
        <InfoItem label={<FormattedMessage defaultMessage="Poste observé" />}>
          {observedMagistrat.proposedPosition ?? '-'}
        </InfoItem>
      </dl>
      <h2 className="fr-h4 fr-mt-8v">
        <FormattedMessage defaultMessage="Biographie de l'observant" />
      </h2>
      {observant.biography ? (
        <BiographyList biography={observant.biography} />
      ) : (
        <p className="fr-mb-0">
          <FormattedMessage defaultMessage="Aucune biographie" />
        </p>
      )}
    </DetailsCard>
  );
}

function InfoItem(props: { children: React.ReactNode; label: React.ReactNode }) {
  return (
    <>
      <dt className="p-0">{props.label}</dt>
      <dd className="m-0 p-0">{props.children}</dd>
    </>
  );
}
