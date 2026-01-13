import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useCallback, type FC } from 'react';
import { useParams } from 'react-router-dom';

import { AlertsProvider } from '@/components/shared/alerts/AlertsProvider';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';
import type { BreadcrumbVM } from '../../../../models/breadcrumb-vm.model';
import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import { Breadcrumb } from '../../../shared/Breadcrumb';
import { TableauAffectationDossierDeNomination } from '../tableau-affectation-dossier-de-nomination/TableauAffectationDossierDeNomination';
import { TableauDeBordActions } from './tableau-de-bord/actions/TableauDeBordActions';
import { TableauDeBordResume } from './tableau-de-bord/resume/TableauDeBordResume';

export const Transparence: FC = () => {
  const { sessionId } = useParams();
  const alertRef = useCallback((ref: HTMLUListElement | null) => {
    ref?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const { data: transparence, isPending, isError } = useDetailedNominationSessionQuery({ sessionId });

  if (isPending) {
    return null;
  }

  if (!transparence || isError) {
    return <div>Session de type Transparence non trouvée.</div>;
  }

  const breadcrumb: BreadcrumbVM = {
    currentPageLabel: transparence.name,
    segments: [
      {
        label: 'Secrétariat général',
        to: ROUTE_PATHS.SG.DASHBOARD
      },
      {
        label: 'Gérer une session',
        to: ROUTE_PATHS.SG.MANAGE_SESSION
      }
    ]
  };

  return (
    <AlertsProvider>
      <div className={cx('fr-container')}>
        <Breadcrumb
          id="transparence-details-breadcrumb"
          ariaLabel="Fil d'Ariane d'une transparence détaillée"
          breadcrumb={breadcrumb}
        />

        <AlertsProvider.Alerts ref={alertRef} />
      </div>

      <div className={'flex flex-col gap-8'}>
        <div className={clsx('gap-8', cx('fr-grid-row', 'fr-container'))}>
          <TableauDeBordActions sessionId={sessionId!} formation={transparence.formation} />
          <TableauDeBordResume {...transparence} />
        </div>
        <TableauAffectationDossierDeNomination formation={transparence.formation} />
      </div>
    </AlertsProvider>
  );
};
