import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import type { FC } from 'react';
import { useParams } from 'react-router-dom';

import { useMemberListQuery } from '@/queries/members.queries';
import { useSessionNominationFilesQuery } from '@queries/nomination-sessions.queries';

import type { FormationEnum } from '@/types/enums.types';

import { AlertsProvider } from '@/components/shared/alerts/AlertsProvider';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { TableauDossiersDeNomination } from '../../../shared/TableauDossiersDeNomination';
import { TableauAffectationDossierDeNominationStatus } from './TableauAffectationDossiersDeNominationStatus';

export type TableauAffectationDossierDeNominationProps = {
  formation: FormationEnum;
};

export const TableauAffectationDossierDeNomination: FC<TableauAffectationDossierDeNominationProps> = ({
  formation
}) => {
  const { sessionId } = useParams();
  const {
    data: dossiersResponse,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useSessionNominationFilesQuery({
    sessionId: sessionId as string
  });

  const {
    data: rapporteursData,
    isLoading: isLoadingRapporteurs,
    isError: isErrorRapporteurs
  } = useMemberListQuery({ formation, limit: 100 });

  if (isLoadingDossiersDeNomination || isLoadingRapporteurs) {
    return <div className="fr-container pb-8">Chargement des dossiers de nomination...</div>;
  }

  if (isErrorDossiersDeNomination || isErrorRapporteurs) {
    return <ErrorMessage message="Erreur lors de la récupération des données" />;
  }

  return (
    <>
      <div id="session-affectation-dossier-de-nomination">
        <AlertsProvider>
          <div className={clsx(`flex items-end justify-between px-0`, cx('fr-container'))}>
            <TableauAffectationDossierDeNominationStatus sessionId={sessionId as string} />

            <AlertsProvider.Alerts small className="my-3 flex-shrink-0" />
          </div>

          <TableauDossiersDeNomination
            dossiersDeNomination={dossiersResponse?.items || []}
            availableRapporteurs={(rapporteursData?.items || []).map(({ id, firstName, lastName }) => ({
              userId: id,
              firstName,
              lastName
            }))}
            canEdit={true}
            formation={formation}
            sessionId={sessionId!}
          />
        </AlertsProvider>
      </div>
    </>
  );
};
