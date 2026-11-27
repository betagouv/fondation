import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CallsForApplicationsTable } from '@/features/calls-for-applications/components/CallsForApplicationsTable';
import { CreateCallForApplicationsButton } from '@/features/calls-for-applications/components/CreateCallForApplicationsButton';
import { UnrecognisedMagistratEmailsTable } from '@/features/magistrats/components/UnrecognisedMagistratEmailsTable';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { LinkTab, LinkTabs } from '@/shared/ui/link-tabs';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { CallsForApplicationsPeriod } from '@queries/calls-for-applications.queries';

function CallsForApplicationsPage(props: { tab: CallsForApplicationsPeriod | 'UNRECOGNISED_EMAILS' }) {
  const { formatMessage } = useIntl();
  const breadcrumbRoot = useBreadcrumbRoot();
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);

  return (
    <>
      <div className="fr-container">
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane des appels à candidatures" })}
          breadcrumb={{
            currentPageLabel: formatMessage({ defaultMessage: 'Appels à candidatures' }),
            segments: breadcrumbRoot,
          }}
          className="fr-mt-8v fr-mb-0"
          id="calls-for-applications-breadcrumb"
        />
      </div>
      <PinnedHeader
        bar={() => (
          <div className="fr-container flex flex-col gap-y-4">
            <div className="flex items-center justify-between gap-4">
              <h1 className="fr-h3 fr-mb-0">
                <FormattedMessage defaultMessage="Appels à candidatures" />
              </h1>
              <CreateCallForApplicationsButton />
            </div>
            {props.tab === 'UNRECOGNISED_EMAILS' ? (
              <p className="fr-mb-0 flex min-h-10 items-center">
                <FormattedMessage defaultMessage="Les adresses que le site du CSM n'a pas pu rattacher à un magistrat ces 30 derniers jours. Une fois l'adresse rattachée, le site reconnaît le magistrat. Prévenez-le ensuite." />
              </p>
            ) : (
              <div className="min-h-10" ref={setFiltersSlot} />
            )}
            <LinkTabs ariaLabel={formatMessage({ defaultMessage: 'Onglets des appels à candidatures' })}>
              <LinkTab
                label={formatMessage({ defaultMessage: 'En cours' })}
                to={ROUTE_PATHS.SG.CSM.CALLS_FOR_APPLICATIONS_ONGOING}
              />
              <LinkTab
                label={formatMessage({ defaultMessage: 'Passés' })}
                to={ROUTE_PATHS.SG.CSM.CALLS_FOR_APPLICATIONS_PAST}
              />
              <LinkTab
                label={formatMessage({ defaultMessage: 'Adresses non reconnues' })}
                to={ROUTE_PATHS.SG.CSM.CALLS_FOR_APPLICATIONS_UNRECOGNISED_EMAILS}
              />
            </LinkTabs>
          </div>
        )}
        barClassName="fr-pt-6v"
        contentClassName="fr-container fr-mt-6v fr-mb-8v"
      >
        {props.tab === 'UNRECOGNISED_EMAILS' ? (
          <UnrecognisedMagistratEmailsTable />
        ) : (
          <CallsForApplicationsTable filtersSlot={filtersSlot} key={props.tab} period={props.tab} />
        )}
      </PinnedHeader>
    </>
  );
}

export function OngoingCallsForApplicationsPage() {
  return <CallsForApplicationsPage tab="ONGOING" />;
}

export function PastCallsForApplicationsPage() {
  return <CallsForApplicationsPage tab="PAST" />;
}

export function UnrecognisedEmailsCallsForApplicationsPage() {
  return <CallsForApplicationsPage tab="UNRECOGNISED_EMAILS" />;
}
