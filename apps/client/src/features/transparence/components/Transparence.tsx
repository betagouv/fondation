import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useCallback } from 'react';
import { useParams } from 'react-router';

import { SgSessionFilesTable } from '@/features/nomination-files-table/components/SgSessionFilesTable';
import { ArchiveBannerPortal, SessionValidationBannerPortal } from '@/shared/components/banners';
import { AlertsProvider } from '@/shared/context/alerts';
import type { BreadcrumbVM } from '@/shared/ui/Breadcrumb';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import * as importAttachments from './ImportAttachmentModal';
import { TableauDeBordResume } from './TableauDeBordResume';
import { TransparenceToolbar } from './TransparenceToolbar';

export function Transparence() {
  const { sessionId } = useParams();
  const alertRef = useCallback((ref: HTMLUListElement | null) => {
    ref?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const { data: transparence, isPending, isError } = useDetailedNominationSessionQuery({ sessionId });

  if (isPending) {
    return null;
  }

  if (!transparence || isError) {
    return <div className="fr-container fr-pt-5v">Session de type Transparence non trouvée.</div>;
  }

  const breadcrumb: BreadcrumbVM = {
    currentPageLabel: transparence.name,
    segments: [
      {
        label: 'Secrétariat général',
        to: ROUTE_PATHS.SG.DASHBOARD,
      },
      {
        label: 'Gérer une session',
        to: ROUTE_PATHS.SG.MANAGE_SESSION,
      },
    ],
  };

  return (
    <ArchiveBannerPortal isArchived={transparence.isArchived}>
      <SessionValidationBannerPortal session={transparence}>
        <AlertsProvider>
          <div className={cx('fr-container')}>
            <Breadcrumb
              id="transparence-details-breadcrumb"
              ariaLabel="Fil d'Ariane d'une transparence détaillée"
              breadcrumb={breadcrumb}
            />

            <AlertsProvider.Alerts ref={alertRef} />
          </div>

          <div className={'flex flex-col gap-8 overflow-x-clip'}>
            <div className="fr-container flex justify-between gap-x-6">
              <importAttachments.ImportAttachmentModal sessionId={transparence.id} />

              <TableauDeBordResume {...transparence} />
            </div>
            <div className="fr-container fr-mb-8v">
              <SgSessionFilesTable
                formation={transparence.formation}
                isEditable={!transparence.isArchived}
                outcomes={transparence.outcomes}
                sessionId={sessionId!}
                toolbar={<TransparenceToolbar transparence={transparence} />}
              />
            </div>
          </div>
        </AlertsProvider>
      </SessionValidationBannerPortal>
    </ArchiveBannerPortal>
  );
}
