import { FormattedMessage } from 'react-intl';

import { BiographyList } from '@/shared/components/biography-list';
import { DetailsCard, DetailsPageLayout } from '@/shared/ui/details';
import { capitalizedFirstName } from '@/utils/user.utils';
import type { DetailedMagistratDto } from '@api/types';

import { MagistratDetailsHeader } from './MagistratDetailsHeader';
import { MagistratIdentityCard } from './MagistratIdentityCard';
import { MagistratNominationFilesSection } from './MagistratNominationFilesSection';
import { MagistratObservationsSection } from './MagistratObservationsSection';
import { MagistratPhoneNumbersSection } from './MagistratPhoneNumbersSection';

type MagistratDetailsContentProps = {
  context: 'sg' | 'membre';
  magistrat: DetailedMagistratDto;
};

export function MagistratDetailsContent({ context, magistrat }: MagistratDetailsContentProps) {
  const careerHistory = magistrat.careerHistory?.trim();

  return (
    <DetailsPageLayout
      background="terreBattue"
      header={<MagistratDetailsHeader context={context} magistrat={magistrat} />}
      identity={
        <MagistratIdentityCard
          magistrat={magistrat}
          phoneNumbers={
            context === 'sg' ? (
              <MagistratPhoneNumbersSection
                magistratId={magistrat.id}
                magistratName={`${capitalizedFirstName(magistrat)} ${magistrat.lastName.toUpperCase()}`}
              />
            ) : null
          }
        />
      }
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
        <MagistratNominationFilesSection context={context} magistratId={magistrat.id} />
      </DetailsCard>

      <DetailsCard>
        <h2 className="fr-h4">
          <FormattedMessage defaultMessage="Observations" />
        </h2>
        <MagistratObservationsSection context={context} magistratId={magistrat.id} />
      </DetailsCard>
    </DetailsPageLayout>
  );
}
