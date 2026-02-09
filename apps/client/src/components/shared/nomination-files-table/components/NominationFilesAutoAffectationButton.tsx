import Button from '@codegouvfr/react-dsfr/Button';
import { useMemo, useRef } from 'react';
import { Link } from 'react-router';

import { useAlerts } from '@/components/shared/alerts/alerts.context';
import { confirmationModal, useConfirmation } from '@/hooks/useConfirmation.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useAutoAffectationMutation,
  useCountUnaffectedFilesQuery
} from '@queries/nomination-sessions.queries';
import { useAffectations } from '../contexts/files-affectations.context';
import { useSelectedFileIds } from '../contexts/files-selection.context';
import { useNominationFilesTable } from '../contexts/files-table.context';
import { MemberExclusionSelector } from './MemberExclusionSelector';

export function NominationFilesAutoAffectationButton() {
  const alerts = useAlerts();
  const confirmation = useConfirmation();
  const selectedIds = useSelectedFileIds();
  const { getAffectations } = useAffectations();
  const { sessionId, formation } = useNominationFilesTable();
  const { mutateAsync: autoAffectation, isPending: isAutoAffecting } = useAutoAffectationMutation();
  const excludedRef = useRef<string[]>([]);

  const nonAffectedFileIds = useMemo(() => {
    if (selectedIds.length === 0) return undefined;

    const affectedIds = new Set(getAffectations().map(({ id }) => id));

    const ids = selectedIds.filter((id) => !affectedIds.has(id));
    return ids.length > 0 ? ids : undefined;
  }, [selectedIds, getAffectations]);

  const { data, isFetching } = useCountUnaffectedFilesQuery({
    sessionId,
    nominationFileIds: nonAffectedFileIds
  });

  const unaffectedFilesCount = data?.count ?? 0;

  const onAutoAffectation = async () => {
    if (isFetching || !unaffectedFilesCount) {
      return;
    }

    excludedRef.current = [];

    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: `Affectation automatique`,
      i18n: { confirm: 'Affecter automatiquement' },
      content: (
        <>
          <p>
            Vous allez affecter automatiquement{' '}
            <strong className="font-bold">{unaffectedFilesCount} dossiers</strong>, actuellement sans
            affectation.
          </p>
          <p>
            L'affectation automatique prend en compte un plan de charge sur la session, ainsi que les
            incompatibilités de juridictions configurées dans{' '}
            <Link to={ROUTE_PATHS.SG.MANAGE_MEMBERS} onClick={() => confirmationModal.close()}>
              &laquo;&nbsp;Gérer les membres&nbsp;&raquo;
            </Link>
          </p>
          <p>
            Une fois l'affectation faite, vous aurez toujours la possibilité de la modifier avant de la
            publier aux membres.
          </p>
          <MemberExclusionSelector formation={formation} excludedRef={excludedRef} />
        </>
      )
    });

    if (!isConfirmed) return;

    await autoAffectation(
      {
        sessionId,
        nominationFileIds: nonAffectedFileIds,
        excludedMemberIds: excludedRef.current.length ? excludedRef.current : undefined
      },
      {
        onSuccess: () => {
          alerts.pushAlert({
            severity: 'success',
            title: "L'attribution automatique des rapports a été effectuée avec succès."
          });
        },
        onError: () => {
          alerts.pushAlert({
            severity: 'error',
            title: "Erreur lors de l'attribution automatique des rapports."
          });
        }
      }
    );
  };

  return (
    <Button
      {...confirmation.buttonProps}
      priority="primary"
      onClick={onAutoAffectation}
      disabled={isAutoAffecting || !unaffectedFilesCount}
      iconId={isAutoAffecting ? undefined : 'fr-icon-sparkling-2-line'}
      title={unaffectedFilesCount ? undefined : 'Tous les dossiers ont des rapporteurs attribués'}
    >
      {isAutoAffecting ? 'Affectation en cours...' : 'Attribuer les rapports'}
    </Button>
  );
}
