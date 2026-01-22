import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useAlerts } from '@/components/shared/alerts/alerts.context';
import { useAffectation } from '@/contexts/AffectationDossiersContext';
import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useAutoAffectationMutation,
  useCountUnaffectedFilesQuery
} from '@queries/nomination-sessions.queries';
import { useNominationFilesTable } from './NominationFilesTableContext';

export function NominationFilesAutoAffectationButton() {
  const alerts = useAlerts();
  const confirmation = useConfirmation();
  const { affectations, selectedDossierIds } = useAffectation();
  const { sessionId } = useNominationFilesTable();
  const { mutateAsync: autoAffectation, isPending: isAutoAffecting } = useAutoAffectationMutation();

  const nonAffectedFileIds = useMemo(() => {
    if (selectedDossierIds.size === 0) return undefined;

    const ids = [...selectedDossierIds].filter((id) => !(id in affectations));
    return ids.length > 0 ? ids : undefined;
  }, [selectedDossierIds, affectations]);

  const { data, isFetching } = useCountUnaffectedFilesQuery({
    sessionId,
    nominationFileIds: nonAffectedFileIds
  });

  const unaffectedFilesCount = useMemo(() => data?.count ?? 0, [data]);

  const onAutoAffectation = useCallback(async () => {
    if (isFetching || !unaffectedFilesCount) {
      return;
    }

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
      { sessionId, nominationFileIds: nonAffectedFileIds },
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
  }, [
    confirmation,
    autoAffectation,
    nonAffectedFileIds,
    unaffectedFilesCount,
    sessionId,
    alerts,
    isFetching
  ]);

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
