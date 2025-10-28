import Accordion from '@codegouvfr/react-dsfr/Accordion';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { ImportAttachmentModal } from './ImportAttachmentModal';
import { ImportObservantsModal } from './ImportObservantsModal';

import { type TransparenceSnapshot } from 'shared-models';
import { useGetTransparencyAttachmentsQuery } from '../../../../../../react-query/queries/get-transparency-attachments.query';

import { DateOnly } from '../../../../../../models/date-only.model';
import { useDeleteFile } from '../../../../../../react-query/mutations/delete-file.mutation';
import { AttachedFilesList } from './AttachedFilesList';
import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import { useGetDossierDeNominationParSession } from '../../../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import { usePublierAffectations } from '../../../../../../react-query/mutations/sg/publier-affectations.mutation';
import { createModal } from '@codegouvfr/react-dsfr/Modal';

type TableauDeBordActionsProps = TransparenceSnapshot & {
  sessionId: string;
};

const publishSuccessModal = createModal({
  id: 'publish-success-modal-actions',
  isOpenedByDefault: false
});

export const TableauDeBordActions = ({
  name,
  formation,
  dateTransparence,
  id,
  sessionId
}: TableauDeBordActionsProps) => {
  const { data: attachments, refetch } = useGetTransparencyAttachmentsQuery(id);
  const { data: dossiersResponse } = useGetDossierDeNominationParSession({ sessionId });

  const { mutate: deleteFile } = useDeleteFile();
  const { mutate: publierAffectations, isPending: isPublishing } = usePublierAffectations();

  const handleDeleteFile = (id: string) => {
    deleteFile(id, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  const dateTransparenceDateOnly = new DateOnly(
    dateTransparence.year,
    dateTransparence.month,
    dateTransparence.day
  );

  const metadata = dossiersResponse?.metadata;
  const isBrouillon = metadata?.statut === 'BROUILLON';

  const onPublierAffectations = () => {
    publierAffectations(sessionId, {
      onSuccess: () => {
        publishSuccessModal.open();
      },
      onError: (error) => {
        console.error('Erreur lors de la publication des affectations:', error);
      }
    });
  };

  return (
    <>
      <div className={clsx('mt-4 flex flex-col justify-start gap-y-6', cx('fr-col-3', 'fr-text--bold'))}>
        <div>TABLEAU DE BORD</div>
        <div>
          <Accordion
            label={
              <span>
                Pièces jointes <Badge>{attachments?.length ?? 0}</Badge>
              </span>
            }
            titleAs="h2"
          >
            {!attachments || attachments.length === 0 ? (
              <div>Aucunes pièces jointes.</div>
            ) : (
              <AttachedFilesList attachedFiles={attachments} onAttachedFileDeleted={handleDeleteFile} />
            )}
          </Accordion>
          <Accordion label="Tableau initial" titleAs="h2">
            Tableau initial à venir.
          </Accordion>
          <Accordion label="Vérifier les règles automatisées" titleAs="h2">
            Vérifier les règles automatisées à venir.
          </Accordion>
        </div>

        <div className="flex flex-col gap-2">
          <ImportObservantsModal
            nomTransparence={name}
            formation={formation}
            dateTransparence={dateTransparenceDateOnly}
          />
          <ImportAttachmentModal
            sessionImportId={id}
            transparenceName={name}
            transparenceFormation={formation}
            transparenceDate={dateTransparenceDateOnly}
          />
          {isBrouillon && (
            <Button
              priority="primary"
              onClick={onPublierAffectations}
              disabled={isPublishing}
              className="w-full"
            >
              <div className="w-full text-center">
                {isPublishing ? 'Publication en cours...' : 'Publier aux membres'}
              </div>
            </Button>
          )}
        </div>
      </div>

      <publishSuccessModal.Component title="Succès">
        <p>Les affectations ont été publiées aux membres avec succès. Les rapports ont été créés.</p>
      </publishSuccessModal.Component>
    </>
  );
};
