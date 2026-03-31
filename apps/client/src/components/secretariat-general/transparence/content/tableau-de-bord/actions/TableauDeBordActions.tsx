import Accordion from '@codegouvfr/react-dsfr/Accordion';
import Badge from '@codegouvfr/react-dsfr/Badge';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useMemo } from 'react';
import { generatePath } from 'react-router';

import type { FormationEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { NominationSessionAttachmentList } from '@/components/shared/NominationSessionAttachmentList';
import * as importAttachments from './ImportAttachmentModal';
import { NominationSessionDocsList } from './NominationSessionDocsList';

import { useAlerts } from '@/components/shared/alerts/alerts.context';
import { useFindSessionDocsQuery, useIsSessionReadyForDocGenerationQuery } from '@queries/agenda.queries';
import {
  useDetailedNominationSessionAffectationsVersionQuery,
  useListNominationFilesAsExcelMutation,
  useListNominationSessionAttachmentsQuery,
  usePublishVersionMutation
} from '@queries/nomination-sessions.queries';

export const TableauDeBordActions = ({ sessionId }: { sessionId: string; formation: FormationEnum }) => {
  const alerts = useAlerts();
  const { data: metadata } = useDetailedNominationSessionAffectationsVersionQuery(sessionId);
  const { data: attachments } = useListNominationSessionAttachmentsQuery({ sessionId });
  const { data: docs } = useFindSessionDocsQuery({ sessionId });
  const { data: docGenerationReadiness } = useIsSessionReadyForDocGenerationQuery({ sessionId });

  const { mutate: publierAffectations, isPending: isPublishing } = usePublishVersionMutation();
  const { mutate: exportAsExcel, isPending: isExporting } = useListNominationFilesAsExcelMutation();

  const docGenerationLinkProps = useMemo(
    () => generatePath(ROUTE_PATHS.SG.NEW_AGENDA, { sessionId }),
    [sessionId]
  );

  const attachmentsCount = (attachments?.items.length ?? 0) + (docs?.items.length ?? 0);

  const isBrouillon = metadata && 'status' in metadata && metadata.status === 'BROUILLON';
  const hasNoVersionYet = metadata?.version === 0;

  const onPublierAffectations = () => {
    publierAffectations(
      { sessionId },
      {
        onSuccess: () => {
          alerts.pushAlert({
            severity: 'success',
            title: 'Session publiée avec succès'
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
                Pièces jointes <Badge>{attachmentsCount}</Badge>
              </span>
            }
            titleAs="h2"
          >
            {attachmentsCount === 0 && (
              <div className="text-center text-sm font-normal text-gray-600">Aucune pièce jointe.</div>
            )}

            <NominationSessionAttachmentList sessionId={sessionId} placeholder={null} />
            <NominationSessionDocsList sessionId={sessionId} />
          </Accordion>
        </div>

        <div className="flex flex-col gap-2">
          <importAttachments.ImportAttachmentModal sessionId={sessionId} />

          <ButtonsGroup
            buttons={[
              {
                priority: 'primary',
                children: 'Importer des pièces jointes',
                nativeButtonProps: importAttachments.modal.buttonProps,
                disabled: isPublishing || isExporting
              },
              {
                priority: 'secondary',
                iconId: 'fr-icon-download-line',
                children: 'Exporter en Excel',
                disabled: isPublishing || isExporting,
                onClick: () => exportAsExcel({ sessionId })
              },
              {
                priority: 'primary',
                onClick: onPublierAffectations,
                disabled: isPublishing || isExporting,
                children: isPublishing ? 'Publication en cours...' : 'Publier aux membres',
                className: isBrouillon || hasNoVersionYet ? 'block' : 'hidden'
              },
              {
                priority: 'secondary',
                iconId: 'fr-icon-folder-2-line',
                linkProps: { to: docGenerationLinkProps },
                children: 'Générer la documentation',
                className: clsx({
                  hidden: !docGenerationReadiness?.isReady
                })
              }
            ]}
          />
        </div>
      </div>
    </>
  );
};
