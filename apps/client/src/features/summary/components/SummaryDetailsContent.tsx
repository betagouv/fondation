import { DetailsPageLayout } from '@/shared/ui/details';

import { SummaryAlerts } from './SummaryAlerts';
import { SummaryAttachmentsCard } from './SummaryAttachmentsCard';
import { SummaryContentCard } from './SummaryContentCard';
import { SummaryDetailsHeader } from './SummaryDetailsHeader';
import { SummaryIdentityCard } from './SummaryIdentityCard';
import { SummaryObservationsCard } from './SummaryObservationsCard';

export function SummaryDetailsContent() {
  return (
    <DetailsPageLayout
      alerts={<SummaryAlerts />}
      background="blueFrance"
      header={<SummaryDetailsHeader />}
      identity={
        <>
          <SummaryIdentityCard />
          <SummaryObservationsCard />
        </>
      }
      wideIdentity
    >
      <SummaryContentCard />
      <SummaryAttachmentsCard />
    </DetailsPageLayout>
  );
}
