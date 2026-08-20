import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Outlet, useParams } from 'react-router';

import { ImportAttachmentModal } from '@/features/transparence/components/attachments/ImportAttachmentModal';
import { SessionTabsBar } from '@/features/transparence/components/session/SessionTabs';
import { SessionValidationBanner } from '@/features/transparence/components/session/SessionValidationBanner';
import { TableauDeBordResume } from '@/features/transparence/components/session/TableauDeBordResume';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { AlertsProvider } from '@/shared/context/alerts';
import type { BreadcrumbVM } from '@/shared/ui/Breadcrumb';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparencePage() {
  const { formatMessage } = useIntl();
  const { sessionId } = useParams();
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);
  const alertRef = useCallback((ref: HTMLUListElement | null) => {
    ref?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const { data: transparence, isPending, isError } = useDetailedNominationSessionQuery({ sessionId });

  if (isPending) {
    return null;
  }

  if (!transparence || isError) {
    return (
      <div className="fr-container fr-pt-5v">
        <FormattedMessage defaultMessage="Session de type Transparence non trouvée." />
      </div>
    );
  }

  const breadcrumb: BreadcrumbVM = {
    currentPageLabel: transparence.name,
    segments: [
      {
        label: formatMessage({ defaultMessage: 'Secrétariat général' }),
        to: ROUTE_PATHS.SG.DASHBOARD,
      },
      {
        label: formatMessage({ defaultMessage: 'Gérer une session' }),
        to: ROUTE_PATHS.SG.MANAGE_SESSION,
      },
    ],
  };

  return (
    <ArchiveBannerPortal isArchived={transparence.isArchived}>
      <AlertsProvider>
        <div className={cx('fr-container')}>
          <SessionValidationBanner session={transparence} />

          <Breadcrumb
            ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane d'une transparence détaillée" })}
            breadcrumb={breadcrumb}
            id="transparence-details-breadcrumb"
          />

          <AlertsProvider.Alerts ref={alertRef} />
        </div>

        <div className={'flex flex-col gap-8 overflow-x-clip'}>
          <div className="fr-container flex justify-between gap-x-6">
            <ImportAttachmentModal sessionId={transparence.id} />

            <TableauDeBordResume {...transparence} />
          </div>
          <div className="fr-container fr-mb-8v flex flex-col gap-y-4">
            <div className="min-h-10" ref={setFiltersSlot} />

            <SessionTabsBar transparence={transparence} />

            <Outlet context={{ filtersSlot } satisfies TransparenceOutletContext} />
          </div>
        </div>
      </AlertsProvider>
    </ArchiveBannerPortal>
  );
}
