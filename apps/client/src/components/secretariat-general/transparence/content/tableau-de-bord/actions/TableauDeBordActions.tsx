import Accordion from '@codegouvfr/react-dsfr/Accordion';
import Badge from '@codegouvfr/react-dsfr/Badge';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

import * as importAttachments from './ImportAttachmentModal';
import * as importObservers from './ImportObservantsModal';

import { useConfirmation } from '../../../../../../hooks/useConfirmation.hook';
import {
  useAutoAffectationMutation,
  useDetailedNominationSessionAffectationsVersionQuery,
  usePublishVersionMutation,
  useSessionNominationFilesQuery
} from '../../../../../../react-query/mutations/sg/nomination-session-affectations';
import { useListNominationSessionAttachmentsQuery } from '../../../../../../react-query/mutations/sg/nomination-sessions';
import { ROUTE_PATHS } from '../../../../../../utils/route-path.utils';
import { NominationSessionAttachmentList } from '../../../../../shared/NominationSessionAttachmentList';
import { useCallback, useMemo } from 'react';

export const TableauDeBordActions = ({
  sessionId,
  onSuccess,
  onFailure
}: {
  sessionId: string;
  onSuccess: (message: string | boolean) => void;
  onFailure: (message: string | boolean) => void;
}) => {
  const confirmation = useConfirmation();
  const { data: metadata } = useDetailedNominationSessionAffectationsVersionQuery(sessionId);
  const { data: nominationFiles } = useSessionNominationFilesQuery({ sessionId });
  const { data: attachments } = useListNominationSessionAttachmentsQuery({ sessionId });
  const { mutate: publierAffectations, isPending: isPublishing } = usePublishVersionMutation();
  const { mutateAsync: autoAffectation, isPending: isAutoAffecting } = useAutoAffectationMutation();

  const nonAffectedFiles = useMemo(
    () => (nominationFiles?.items ?? []).filter((f) => f.reporters.length === 0),
    [nominationFiles]
  );
  const hasAnyNonAffectedFiles = useMemo(() => nonAffectedFiles.length > 0, [nonAffectedFiles]);

  const isBrouillon = metadata?.status === 'BROUILLON';

  const onPublierAffectations = () => {
    publierAffectations(
      { sessionId },
      {
        onSuccess: () => {
          onSuccess('Les affectations ont été publiées aux membres avec succès. Les rapports ont été créés.');
        },
        onError: () => {
          onFailure('Erreur lors de la publication des affectations');
        }
      }
    );
  };

  const onAutoAffectation = useCallback(async () => {
    if (!hasAnyNonAffectedFiles) {
      return;
    }

    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: `Affectation automatique`,
      i18n: { confirm: 'Affecter automatiquement' },
      content: (
        <>
          <p>
            Vous allez affecter automatiquement{' '}
            <strong className="font-bold">{nonAffectedFiles.length} dossiers</strong>, actuellement sans
            affectation.
          </p>
          <p>
            L'affectation automatique prend en compte un plan de charge sur la session, ainsi que les
            incompatibilités de juridictions configurées dans{' '}
            <Link to={ROUTE_PATHS.SG.MANAGE_MEMBERS}>&laquo;&nbsp;Gérer les membres&nbsp;&raquo;</Link>
          </p>
          <p>
            Une fois l'affectation faite, vous aurez toujours la possibilité de la modifier avant de la
            publier aux membres.
          </p>
        </>
      )
    });

    if (!isConfirmed) return;

    await autoAffectation(
      { sessionId, nominationFileIds: nonAffectedFiles.map(({ id }) => id) },
      {
        onSuccess: () => {
          onSuccess("L'attribution automatique des rapports a été effectuée avec succès.");
        },
        onError: () => {
          onFailure("Erreur lors de l'attribution automatique des rapports.");
        }
      }
    );
  }, [
    confirmation,
    hasAnyNonAffectedFiles,
    autoAffectation,
    nonAffectedFiles,
    onFailure,
    onSuccess,
    sessionId
  ]);

  return (
    <>
      <div className={clsx('mt-4 flex flex-col justify-start gap-y-6', cx('fr-col-3', 'fr-text--bold'))}>
        <div>TABLEAU DE BORD</div>
        <div>
          <Accordion
            label={
              <span>
                Pièces jointes <Badge>{attachments?.items.length ?? 0}</Badge>
              </span>
            }
            titleAs="h2"
          >
            <NominationSessionAttachmentList sessionId={sessionId} />
          </Accordion>
        </div>

        <div className="flex flex-col gap-2">
          <importObservers.ImportObservantsModal onSuccess={() => onSuccess(true)} sessionId={sessionId} />
          <importAttachments.ImportAttachmentModal onSuccess={() => onSuccess(true)} sessionId={sessionId} />

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
                nativeButtonProps: { ...confirmation.buttonProps },
                iconId: isAutoAffecting ? undefined : 'fr-icon-sparkling-2-line',
                priority: 'secondary',
                title: hasAnyNonAffectedFiles ? undefined : 'Tous les rapports ont des rapporteurs affectés',
                onClick: onAutoAffectation,
                disabled: isAutoAffecting || isPublishing || !hasAnyNonAffectedFiles,
                children: isAutoAffecting ? 'Attribution en cours...' : 'Attribuer les rapports'
              },
              {
                priority: 'primary',
                onClick: onPublierAffectations,
                disabled: isPublishing || isAutoAffecting,
                children: isPublishing ? 'Publication en cours...' : 'Publier aux membres',
                className: isBrouillon ? 'block' : 'hidden'
              }
            ]}
          />
        </div>
      </div>
    </>
  );
};
