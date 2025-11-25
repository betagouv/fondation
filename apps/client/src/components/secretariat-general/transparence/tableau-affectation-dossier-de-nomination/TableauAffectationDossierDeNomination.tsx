import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import type { FC } from 'react';
import { useParams } from 'react-router-dom';
import type { Magistrat } from 'shared-models';
import {
  useAffectNominationFilesReportersMutation,
  useSessionNominationFilesQuery
} from '../../../../react-query/mutations/sg/nomination-session-affectations';
import { useGetUsersByFormation } from '../../../../react-query/queries/sg/get-users-by-formation.query';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { createSuccessModal } from '../../../shared/SuccessModal';
import { TableauDossiersDeNomination } from '../../../shared/TableauDossiersDeNomination';
import { ExcelExport } from './ExcelExport';
import { TableauAffectationDossierDeNominationStatus } from './TableauAffectationDossiersDeNominationStatus';
import type { DossierAffectation } from '../../../../contexts/AffectationDossiersContext';

const successModal = createSuccessModal({
  id: 'affectations-success-modal'
});

export type TableauAffectationDossierDeNominationProps = {
  formation: Magistrat.Formation;
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
  } = useGetUsersByFormation(formation);

  const { mutate: saveAffectations } = useAffectNominationFilesReportersMutation();

  const onSaveAffectations = (affectations: readonly DossierAffectation[]) => {
    if (!sessionId) return;

    saveAffectations(
      {
        sessionId,
        affectations: affectations.map(
          ({ dossierId: nominationFileId, rapporteurIds: reporterIds, priorite }) => ({
            nominationFileId,
            reporterIds,
            priority: priorite ?? null
          })
        )
      },
      {
        onSuccess: () => {
          successModal.open();
        },
        onError: (error) => {
          console.error('Erreur lors de la sauvegarde des affectations:', error);
        }
      }
    );
  };

  if (isLoadingDossiersDeNomination || isLoadingRapporteurs) {
    return <div>Chargement des dossiers de nomination...</div>;
  }

  if (isErrorDossiersDeNomination || isErrorRapporteurs) {
    return <ErrorMessage message="Erreur lors de la récupération des données" />;
  }

  return (
    <>
      <div id="session-affectation-dossier-de-nomination" className={cx('fr-py-1v')}>
        <TableauAffectationDossierDeNominationStatus sessionId={sessionId as string} />

        <TableauDossiersDeNomination
          dossiersDeNomination={dossiersResponse?.items || []}
          availableRapporteurs={rapporteursData || []}
          showExportButton={true}
          ExportComponent={ExcelExport}
          canEdit={true}
          onSaveAffectations={onSaveAffectations}
        />
      </div>

      <successModal.Component />
    </>
  );
};
