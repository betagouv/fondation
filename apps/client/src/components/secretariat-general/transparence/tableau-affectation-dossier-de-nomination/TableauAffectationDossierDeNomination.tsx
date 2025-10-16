import { useParams } from 'react-router-dom';
import { useGetDossierDeNominationParSession } from '../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import { useGetUsersByFormation } from '../../../../react-query/queries/sg/get-users-by-formation.query';
import { useSaveAffectationsRapporteurs } from '../../../../react-query/mutations/save-affectations-rapporteurs.mutation';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { TableauDossiersDeNomination } from '../../../shared/TableauDossiersDeNomination';
import { ExcelExport } from './ExcelExport';
import type { Magistrat } from 'shared-models';
import type { FC } from 'react';
import { createModal } from '@codegouvfr/react-dsfr/Modal';

const successModal = createModal({
  id: 'affectations-success-modal',
  isOpenedByDefault: false
});

export type TableauAffectationDossierDeNominationProps = {
  formation: Magistrat.Formation;
};

export const TableauAffectationDossierDeNomination: FC<TableauAffectationDossierDeNominationProps> = ({
  formation
}) => {
  const { sessionId } = useParams();
  const {
    data: dossiersData,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useGetDossierDeNominationParSession({
    sessionId: sessionId as string
  });

  const {
    data: rapporteursData,
    isLoading: isLoadingRapporteurs,
    isError: isErrorRapporteurs
  } = useGetUsersByFormation(formation);

  const { mutate: saveAffectations } = useSaveAffectationsRapporteurs();

  const onSaveAffectations = (affectations: { dossierId: string; rapporteurIds: string[] }[]) => {
    if (!sessionId) return;

    saveAffectations(
      {
        sessionId,
        affectations
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
        <TableauDossiersDeNomination
          dossiersDeNomination={dossiersData || []}
          availableRapporteurs={rapporteursData || []}
          showExportButton={true}
          ExportComponent={ExcelExport}
          canEdit={true}
          onSaveAffectations={onSaveAffectations}
        />
      </div>

      <successModal.Component title="Succès">
        <p>Les affectations des rapporteurs ont été sauvegardées avec succès.</p>
      </successModal.Component>
    </>
  );
};
