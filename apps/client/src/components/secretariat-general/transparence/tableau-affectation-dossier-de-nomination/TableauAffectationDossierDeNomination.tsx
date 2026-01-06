import Alert from '@codegouvfr/react-dsfr/Alert';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import type { FC } from 'react';
import { useParams } from 'react-router-dom';

import {
  useAffectNominationFilesReportersMutation,
  useSessionNominationFilesQuery
} from '@queries/nomination-sessions.queries';
import { useMemberListQuery } from '@/queries/members.queries';

import type { FormationEnum, PrioriteEnum } from '@/types/enums.types';

import type { DossierAffectation } from '../../../../contexts/AffectationDossiersContext';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { TableauDossiersDeNomination } from '../../../shared/TableauDossiersDeNomination';
import { ExcelExport } from './ExcelExport';
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

  const { mutate: saveAffectations, isSuccess: saveAffectationsIsSuccess } =
    useAffectNominationFilesReportersMutation();

  const onSaveAffectations = (affectations: readonly DossierAffectation[]) => {
    if (!sessionId) return;

    saveAffectations({
      sessionId,
      affectations: affectations.map(
        ({ dossierId: nominationFileId, rapporteurIds: reporterIds, priorite }) => ({
          nominationFileId,
          reporterIds,
          priority: (priorite ?? null) as PrioriteEnum // issue with the code generation
        })
      )
    });
  };

  if (isLoadingDossiersDeNomination || isLoadingRapporteurs) {
    return <div className="fr-container pb-8">Chargement des dossiers de nomination...</div>;
  }

  if (isErrorDossiersDeNomination || isErrorRapporteurs) {
    return <ErrorMessage message="Erreur lors de la récupération des données" />;
  }

  return (
    <>
      <div id="session-affectation-dossier-de-nomination">
        <div className={clsx(`flex h-16 items-end justify-between px-0`, cx('fr-container'))}>
          <TableauAffectationDossierDeNominationStatus sessionId={sessionId as string} />

          {saveAffectationsIsSuccess && (
            <Alert
              small
              className="my-3 flex-shrink-0"
              severity="success"
              description="Succès: Données actualisées"
              closable
            />
          )}
        </div>

        <TableauDossiersDeNomination
          dossiersDeNomination={dossiersResponse?.items || []}
          availableRapporteurs={(rapporteursData?.items || []).map(({ id, firstName, lastName }) => ({
            userId: id,
            firstName,
            lastName
          }))}
          showExportButton={true}
          ExportComponent={ExcelExport}
          canEdit={true}
          onSaveAffectations={onSaveAffectations}
          formation={formation}
        />
      </div>
    </>
  );
};
