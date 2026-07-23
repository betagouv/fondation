import { FormattedMessage } from 'react-intl';

import { BiographyList } from '@/shared/components/biography-list';
import { DetailsCard, DetailsPageLayout } from '@/shared/ui/details';
import type { DetailedMagistratDto } from '@api/types';

import { DetailsHeader } from './DetailsHeader';
import { IdentityCard } from './IdentityCard';
import { NominationFilesTable } from './NominationFilesTable';

type DetailsContentProps = {
  context: 'sg' | 'membre';
  magistrat: DetailedMagistratDto;
};

export function DetailsContent({ context, magistrat }: DetailsContentProps) {
  const careerHistory = magistrat.careerHistory?.trim();

  return (
    <DetailsPageLayout
      background="terreBattue"
      header={<DetailsHeader context={context} magistrat={magistrat} />}
      identity={<IdentityCard magistrat={magistrat} />}
    >
      {careerHistory ? (
        <DetailsCard>
          <h2 className="fr-h4">
            <FormattedMessage defaultMessage="Biographie" />
          </h2>
          <BiographyList biography={careerHistory} />
        </DetailsCard>
      ) : null}

      <DetailsCard>
        <h2 className="fr-h4">
          <FormattedMessage defaultMessage="Propositions" />
        </h2>
        {magistrat.propositions.length === 0 ? (
          <p className="fr-mb-0">
            <FormattedMessage defaultMessage="Aucune proposition" />
          </p>
        ) : (
          <NominationFilesTable context={context} nominationFiles={magistrat.propositions} />
        )}
      </DetailsCard>

      <DetailsCard>
        <h2 className="fr-h4">
          <FormattedMessage defaultMessage="Observations" />
        </h2>
        {magistrat.observations.length === 0 ? (
          <p className="fr-mb-0">
            <FormattedMessage defaultMessage="Aucune observation" />
          </p>
        ) : (
          <NominationFilesTable context={context} nominationFiles={magistrat.observations} />
        )}
      </DetailsCard>
    </DetailsPageLayout>
  );
}
