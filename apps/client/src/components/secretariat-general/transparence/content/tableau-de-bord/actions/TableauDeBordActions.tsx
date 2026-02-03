import Accordion from '@codegouvfr/react-dsfr/Accordion';
import Badge from '@codegouvfr/react-dsfr/Badge';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';

import * as importAttachments from './ImportAttachmentModal';
import * as importObservers from './ImportObservantsModal';

import { useAlerts } from '@/components/shared/alerts/alerts.context';
import type { FormationEnum } from '@/types/enums.types';
import {
  useDetailedNominationSessionAffectationsVersionQuery,
  useListNominationFilesAsExcelMutation,
  useListNominationSessionAttachmentsQuery,
  usePublishVersionMutation
} from '@queries/nomination-sessions.queries';
import { NominationSessionAttachmentList } from '../../../../../shared/NominationSessionAttachmentList';

export const TableauDeBordActions = ({ sessionId }: { sessionId: string; formation: FormationEnum }) => {
  const alerts = useAlerts();
  const { data: metadata } = useDetailedNominationSessionAffectationsVersionQuery(sessionId);
  const { data: attachments } = useListNominationSessionAttachmentsQuery({ sessionId });
  const { mutate: publierAffectations, isPending: isPublishing } = usePublishVersionMutation();
  const { mutate: exportAsExcel } = useListNominationFilesAsExcelMutation();

  const isBrouillon = metadata?.status === 'BROUILLON';
  const hasNoVersionYet = metadata?.version === 0;

  const onPublierAffectations = () => {
    publierAffectations(
      { sessionId },
      {
        onSuccess: () => {
          alerts.pushAlert({
            severity: 'success',
            title: 'Les affectations ont été publiées aux membres avec succès. Les rapports ont été créés.'
          });
        },
        onError: () => {
          alerts.pushAlert({
            severity: 'error',
            title: 'Erreur lors de la publication des affectations'
          });
        }
      }
    );
  };

  return (
    <>
      <div className={clsx('mt-4 flex flex-col justify-start gap-y-6', cx('fr-col-3', 'fr-text--bold'))}>
        <div>TABLEAU DE BORD</div>
        <div>
          <Accordion
            label={
              <span>
                Pièces jointes <Badge>{attachments?.items?.length ?? 0}</Badge>
              </span>
            }
            titleAs="h2"
          >
            <NominationSessionAttachmentList sessionId={sessionId} />
          </Accordion>
        </div>

        <div className="flex flex-col gap-2">
          <importObservers.ImportObservantsModal sessionId={sessionId} />
          <importAttachments.ImportAttachmentModal sessionId={sessionId} />

          <ButtonsGroup
            buttons={[
              {
                children: 'Importer les observations',
                nativeButtonProps: importObservers.modal.buttonProps
              },
              {
                priority: 'secondary',
                children: 'Importer une pièce jointe',
                nativeButtonProps: importAttachments.modal.buttonProps
              },
              {
                // TODO: fix the excel export in the backend
                priority: 'secondary',
                iconId: 'fr-icon-download-line',
                // disabled: true,
                children: 'Exporter en Excel',
                onClick: () => exportAsExcel({ sessionId })
              },
              {
                priority: 'primary',
                onClick: onPublierAffectations,
                disabled: isPublishing,
                children: isPublishing ? 'Publication en cours...' : 'Publier aux membres',
                className: isBrouillon || hasNoVersionYet ? 'block' : 'hidden'
              }
            ]}
          />
        </div>
      </div>
    </>
  );
};
