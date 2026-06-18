import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useCallback } from 'react';
import { useParams } from 'react-router';

import { AlertsProvider } from '@/components/shared/alerts/AlertsProvider';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { ArchiveBannerPortal } from '@/components/shared/layouts/archived-banner/ArchiveBannerPortal';
import { NominationFilesTable } from '@/components/shared/nomination-files-table/NominationFilesTable';
import type { BreadcrumbVM } from '@/models/breadcrumb-vm.model';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import * as importAttachments from './ImportAttachmentModal';
import { TableauDeBordActions } from './TableauDeBordActions';
import { TableauDeBordResume } from './TableauDeBordResume';
import { TableauDeBordValidationCallOut } from './TableauDeBordValidationCallOut';

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
      <AlertsProvider>
        <div className={cx('fr-container')}>
          <Breadcrumb
            id="transparence-details-breadcrumb"
            ariaLabel="Fil d'Ariane d'une transparence détaillée"
            breadcrumb={breadcrumb}
          />

          <TableauDeBordValidationCallOut session={transparence} />

          <AlertsProvider.Alerts ref={alertRef} />
        </div>

        <div className={'flex flex-col gap-8'}>
          <div className="fr-container flex justify-between gap-x-6">
            <importAttachments.ImportAttachmentModal sessionId={transparence.id} />

            <TableauDeBordResume {...transparence} />
            <TableauDeBordActions sessionId={sessionId!} />
          </div>
          <div className="fr-mb-8v">
            <NominationFilesTable
              sessionId={sessionId!}
              formation={transparence.formation}
              isEditable={!transparence.isArchived}
            />
          </div>
        </div>
      </AlertsProvider>
    </ArchiveBannerPortal>
  );
}
