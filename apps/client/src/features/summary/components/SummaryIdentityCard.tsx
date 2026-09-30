import { FormattedMessage } from 'react-intl';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { FormattedPositionDuration } from '@/i18n/components';
import { BiographyList } from '@/shared/components/biography-list';
import { IdentityList } from '@/shared/components/identity-list';
import { DetailsCard } from '@/shared/ui/details';

export function SummaryIdentityCard() {
  const { summary } = useSummary();

  return (
    <DetailsCard>
      <h2 className="fr-h6">
        <FormattedMessage defaultMessage="Informations professionnelles" />
      </h2>
      <IdentityList
        birthDate={summary.birthDate}
        currentPosition={summary.position}
        grade={summary.grade}
        positionDuration={
          summary.lastPositionDate && <FormattedPositionDuration value={summary.lastPositionDate} />
        }
        rank={summary.rank}
        targetedGrade={summary.targetedGrade}
        targetedPosition={summary.targetedPosition}
      />

      <h2 className="fr-h6 fr-mt-8v">
        <FormattedMessage defaultMessage="Biographie" />
      </h2>
      {summary.biography ? (
        <BiographyList biography={summary.biography} />
      ) : (
        <p className="fr-mb-0">
          <FormattedMessage defaultMessage="Aucune biographie" />
        </p>
      )}
    </DetailsCard>
  );
}
