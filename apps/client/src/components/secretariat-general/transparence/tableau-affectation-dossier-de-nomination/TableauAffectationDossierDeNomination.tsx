import { useParams } from 'react-router-dom';
import { useGetDossierDeNominationParSession } from '../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import { useGetUsersByFormation } from '../../../../react-query/queries/sg/get-users-by-formation.query';
import { useSaveAffectationsRapporteurs } from '../../../../react-query/mutations/sg/save-affectations-rapporteurs.mutation';
import { usePublierAffectations } from '../../../../react-query/mutations/sg/publier-affectations.mutation';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { TableauDossiersDeNomination } from '../../../shared/TableauDossiersDeNomination';
import { ExcelExport } from './ExcelExport';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Badge } from '@codegouvfr/react-dsfr/Badge';
import type { Magistrat } from 'shared-models';
import type { FC } from 'react';
import { createModal } from '@codegouvfr/react-dsfr/Modal';

const successModal = createModal({
  id: 'affectations-success-modal',
  isOpenedByDefault: false
});

const publishSuccessModal = createModal({
  id: 'publish-success-modal',
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
    data: dossiersResponse,
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
  const { mutate: publierAffectations, isPending: isPublishing } = usePublierAffectations();

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

  const onPublierAffectations = () => {
    if (!sessionId) return;

    publierAffectations(sessionId, {
      onSuccess: () => {
        publishSuccessModal.open();
      },
      onError: (error) => {
        console.error('Erreur lors de la publication des affectations:', error);
      }
    });
  };

  if (isLoadingDossiersDeNomination || isLoadingRapporteurs) {
    return <div>Chargement des dossiers de nomination...</div>;
  }

  if (isErrorDossiersDeNomination || isErrorRapporteurs) {
    return <ErrorMessage message="Erreur lors de la récupération des données" />;
  }

  const metadata = dossiersResponse?.metadata;
  const isBrouillon = metadata?.statut === 'BROUILLON';

  return (
    <>
      <div id="session-affectation-dossier-de-nomination" className={cx('fr-py-1v')}>
        <div className={cx('fr-mb-2w', 'fr-grid-row', 'fr-grid-row--gutters', 'fr-grid-row--middle')}>
          <div className="fr-col">
            {metadata && (
              <Badge severity={isBrouillon ? 'info' : 'success'}>
                {isBrouillon ? 'Brouillon' : 'Publiée'}
                {metadata.version > 1 && ` - Version ${metadata.version}`}
              </Badge>
            )}
          </div>
          {isBrouillon && (
            <div className="fr-col-auto">
              <Button priority="primary" onClick={onPublierAffectations} disabled={isPublishing}>
                {isPublishing ? 'Publication en cours...' : 'Publier aux membres'}
              </Button>
            </div>
          )}
        </div>

        <TableauDossiersDeNomination
          dossiersDeNomination={dossiersResponse?.dossiers || []}
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

      <publishSuccessModal.Component title="Succès">
        <p>Les affectations ont été publiées aux membres avec succès. Les rapports ont été créés.</p>
      </publishSuccessModal.Component>
    </>
  );
};
