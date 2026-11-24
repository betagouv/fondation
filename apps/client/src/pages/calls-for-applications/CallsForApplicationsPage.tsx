import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CallForApplicationsModal } from '@/features/calls-for-applications/components/CallForApplicationsModal';
import { CallsForApplicationsTable } from '@/features/calls-for-applications/components/CallsForApplicationsTable';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { LinkTab, LinkTabs } from '@/shared/ui/link-tabs';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { CallsForApplicationsPeriod } from '@queries/calls-for-applications.queries';

function CreateCallForApplicationsButton() {
  // the modal outlives the closing, for it to fade out with its content
  const [creation, setCreation] = useState<{ open: boolean } | null>(null);

  return (
    <>
      <Button
        className="btn-compact"
        iconId="fr-icon-add-line"
        onClick={() => setCreation({ open: true })}
        size="small"
      >
        <FormattedMessage defaultMessage="Créer un appel à candidatures" />
      </Button>
      {creation && (
        <CallForApplicationsModal
          edited={null}
          onClose={() => setCreation({ open: false })}
          onClosed={() => setCreation(null)}
          open={creation.open}
        />
      )}
    </>
  );
}

function CallsForApplicationsPage(props: { period: CallsForApplicationsPeriod }) {
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
            <div className="min-h-10" ref={setFiltersSlot} />
            <LinkTabs
              ariaLabel={formatMessage({ defaultMessage: 'Appels à candidatures en cours ou passés' })}
            >
              <LinkTab
                label={formatMessage({ defaultMessage: 'En cours' })}
                to={ROUTE_PATHS.SG.CSM.CALLS_FOR_APPLICATIONS_ONGOING}
              />
              <LinkTab
                label={formatMessage({ defaultMessage: 'Passés' })}
                to={ROUTE_PATHS.SG.CSM.CALLS_FOR_APPLICATIONS_PAST}
              />
            </LinkTabs>
          </div>
        )}
        barClassName="fr-pt-6v"
        contentClassName="fr-container fr-mt-6v fr-mb-8v"
      >
        <CallsForApplicationsTable filtersSlot={filtersSlot} key={props.period} period={props.period} />
      </PinnedHeader>
    </>
  );
}

export function OngoingCallsForApplicationsPage() {
  return <CallsForApplicationsPage period="ONGOING" />;
}

export function PastCallsForApplicationsPage() {
  return <CallsForApplicationsPage period="PAST" />;
}
