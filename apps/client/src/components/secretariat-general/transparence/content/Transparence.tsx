import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useCallback, useState, type FC } from 'react';
import { useParams } from 'react-router-dom';

import Alert from '@codegouvfr/react-dsfr/Alert';
import { useQuery } from '@tanstack/react-query';
import type { BreadcrumbVM } from '../../../../models/breadcrumb-vm.model';
import { detailNominationSessionQuery } from '../../../../react-query/mutations/sg/nomination-sessions';
import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import { Breadcrumb } from '../../../shared/Breadcrumb';
import { TableauAffectationDossierDeNomination } from '../tableau-affectation-dossier-de-nomination/TableauAffectationDossierDeNomination';
import { TableauDeBordActions } from './tableau-de-bord/actions/TableauDeBordActions';
import { TableauDeBordResume } from './tableau-de-bord/resume/TableauDeBordResume';

export const Transparence: FC = () => {
  const { sessionId } = useParams();
  const alertRef = useCallback((ref: HTMLDivElement | null) => {
    ref?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const [hasSuccessMessage, setSuccessMessage] = useState<boolean | string>(false);
  const [hasFailureMessage, setFailureMessage] = useState<boolean | string>(false);

  const {
    data: transparence,
    isPending,
    isError
  } = useQuery({
    queryKey: [`detail-nomination-session`, sessionId],
    queryFn: () => detailNominationSessionQuery({ sessionId })
  });

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
        label: 'Secretariat général',
        to: ROUTE_PATHS.SG.DASHBOARD
      },
      {
        label: 'Gérer une session',
        to: ROUTE_PATHS.SG.MANAGE_SESSION
      }
    ]
  };

  return (
    <>
      <div className={cx('fr-container')}>
        <Breadcrumb
          id="transparence-details-breadcrumb"
          ariaLabel="Fil d'Ariane d'une transparence détaillée"
          breadcrumb={breadcrumb}
        />

        {hasSuccessMessage && (
          <Alert
            closable
            ref={alertRef}
            className="mb-4"
            severity="success"
            title={typeof hasSuccessMessage === 'string' ? hasSuccessMessage : 'Données actualisées'}
          />
        )}
        {hasFailureMessage && (
          <Alert
            closable
            ref={alertRef}
            className="mb-4"
            severity="success"
            title={hasFailureMessage || 'Données actualisées'}
          />
        )}
      </div>

      <div className={'flex flex-col gap-8'}>
        <div className={clsx('gap-8', cx('fr-grid-row', 'fr-container'))}>
          <TableauDeBordActions
            {...transparence}
            sessionId={sessionId!}
            onSuccess={(message: string | boolean) => {
              setSuccessMessage(message);
            }}
            onFailure={(message: string | boolean) => {
              setFailureMessage(message);
            }}
          />
          <TableauDeBordResume
            {...transparence}
            onSuccess={(message) => {
              setSuccessMessage(message);
            }}
            onFailure={(message) => {
              setFailureMessage(message);
            }}
          />
        </div>
        <TableauAffectationDossierDeNomination formation={transparence.formation} />
      </div>
    </>
  );
};
