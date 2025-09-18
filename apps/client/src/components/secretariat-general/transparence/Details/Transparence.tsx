import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { type FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useGetTransparence } from '../../../../react-query/queries/sg/get-transparence.query';
import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import type { BreadcrumbVM } from '../../../../models/breadcrumb-vm.model';
import { Breadcrumb } from '../../../shared/Breadcrumb';
import { TableauAffectationDossierDeNomination } from '../tableau-affectation-dossier-de-nomination/TableauAffectationDossierDeNomination';
import { TableauDeBordActions } from './tableau-de-bord/actions/TableauDeBordActions';
import { TableauDeBordResume } from './tableau-de-bord/resume/TableauDeBordResume';

export const Transparence: FC = () => {
  const { sessionImportId, sessionId } = useParams();
  const navigate = useNavigate();

  const {
    data: transparence,
    isPending,
    isError
  } = useGetTransparence({
    args: {
      sessionId: sessionImportId as string
    },
    enabled: !!sessionId
  });

  if (isPending) {
    return null;
  }

  if (!sessionImportId || !transparence || isError) {
    return <div>Session de type Transparence non trouvée.</div>;
  }

  const breadcrumb: BreadcrumbVM = {
    currentPageLabel: transparence.name,
    segments: [
      {
        label: 'Secretariat général',
        href: ROUTE_PATHS.SG.DASHBOARD,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          navigate(ROUTE_PATHS.SG.DASHBOARD);
        }
      },
      {
        label: 'Gérer une session',
        href: ROUTE_PATHS.SG.MANAGE_SESSION,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          navigate(ROUTE_PATHS.SG.MANAGE_SESSION);
        }
      }
    ]
  };

  return (
    <>
      <Breadcrumb
        id="transparence-details-breadcrumb"
        ariaLabel="Fil d'Ariane d'une transparence détaillée"
        breadcrumb={breadcrumb}
      />
      <div className={'flex flex-col gap-8'}>
        <div className={clsx('gap-8', cx('fr-grid-row'))}>
          <TableauDeBordActions {...transparence} />
          <TableauDeBordResume {...transparence} />
        </div>
        <TableauAffectationDossierDeNomination />
      </div>
    </>
  );
};

export default Transparence;
