import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router';

import { useAffectations } from '../context/files-affectations.context';
import { useSelectedFileIds } from '../context/files-selection.context';
import { useNominationFilesTable } from '../context/files-table.context';
import { useAlerts } from '@/components/shared/alerts/alerts.context';
import { confirmationModal, useConfirmation } from '@/hooks/useConfirmation.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useAutoAffectationMutation,
  useCountUnaffectedFilesQuery,
} from '@queries/nomination-sessions.queries';

import { MemberExclusionSelector } from './MemberExclusionSelector';

export function NominationFilesAutoAffectationButton() {
  const alerts = useAlerts();
  const confirmation = useConfirmation();
  const selectedIds = useSelectedFileIds();
  const { getAffectations } = useAffectations();
  const { sessionId, formation, edition } = useNominationFilesTable();
  const { mutateAsync: autoAffectation, isPending: isAutoAffecting } = useAutoAffectationMutation();
  const excludedMemberIdsRef = useRef<string[]>([]);

  const nonAffectedFileIds = useMemo(() => {
    if (selectedIds.length === 0) return undefined;

    const affectedIds = new Set(getAffectations().map(({ id }) => id));

    const ids = selectedIds.filter((id) => !affectedIds.has(id));
    return ids.length > 0 ? ids : undefined;
  }, [selectedIds, getAffectations]);

  const { data, isFetching } = useCountUnaffectedFilesQuery({
    sessionId,
    nominationFileIds: nonAffectedFileIds,
  });

  const unaffectedFilesCount = data?.count ?? 0;

  const onAutoAffectation = useCallback(async () => {
    if (isFetching || !unaffectedFilesCount) {
      return;
    }

    excludedMemberIdsRef.current = [];

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
          <MemberExclusionSelector formation={formation} excludedMemberIdsRef={excludedMemberIdsRef} />
        </>
      ),
    });

    if (!isConfirmed) return;

    await autoAffectation(
      {
        sessionId,
        nominationFileIds: nonAffectedFileIds,
        excludedMemberIds: excludedMemberIdsRef.current.length ? excludedMemberIdsRef.current : undefined,
      },
      {
        onSuccess: () => {
          edition?.setEditing(false);
        },
        onError: () => {
          alerts.pushAlert({
            severity: 'error',
            title: "Erreur lors de l'attribution automatique des rapports.",
          });
        },
      },
    );
  }, [
    isFetching,
    unaffectedFilesCount,
    confirmation,
    formation,
    autoAffectation,
    sessionId,
    nonAffectedFileIds,
    alerts,
    edition,
  ]);

  return (
    <Button
      {...confirmation.buttonProps}
      size="small"
      priority="primary"
      onClick={onAutoAffectation}
      disabled={isAutoAffecting || !unaffectedFilesCount}
      iconId={isAutoAffecting ? undefined : 'fr-icon-sparkling-2-line'}
      title={unaffectedFilesCount ? undefined : 'Tous les dossiers ont des rapporteurs attribués'}
    >
      {isAutoAffecting ? 'En cours...' : 'Aff. auto'}
    </Button>
  );
}
