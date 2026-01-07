import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useMemo } from 'react';

import { useAlerts } from '@/components/shared/alerts/alerts.context';
import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useAutoAffectationMutation,
  useSessionNominationFilesQuery
} from '@queries/nomination-sessions.queries';
import { Link } from 'react-router-dom';
import { useAffectation } from '@/contexts/AffectationDossiersContext';

export function NominationFilesAutoAffectationButton(props: { sessionId: string }) {
  const alerts = useAlerts();
  const confirmation = useConfirmation();
  const { affectations } = useAffectation();
  const { mutateAsync: autoAffectation, isPending: isAutoAffecting } = useAutoAffectationMutation();
  const { data: nominationFiles } = useSessionNominationFilesQuery({ sessionId: props.sessionId });

  const nonAffectedFileIds = useMemo(
    () =>
      (nominationFiles?.items ?? [])
        .filter((item) => (affectations[item.id] ?? item.reporters).length === 0)
        .map(({ id }) => id),
    [nominationFiles, affectations]
  );
  const hasAnyNonAffectedFile = useMemo(() => nonAffectedFileIds.length > 0, [nonAffectedFileIds]);

  const onAutoAffectation = useCallback(async () => {
    if (!hasAnyNonAffectedFile) {
      return;
    }

    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: `Affectation automatique`,
      i18n: { confirm: 'Affecter automatiquement' },
      content: (
        <>
          <p>
            Vous allez affecter automatiquement{' '}
            <strong className="font-bold">{nonAffectedFileIds.length} dossiers</strong>, actuellement sans
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
      { sessionId: props.sessionId, nominationFileIds: nonAffectedFileIds },
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
  }, [confirmation, hasAnyNonAffectedFile, autoAffectation, nonAffectedFileIds, props.sessionId, alerts]);

  return (
    <Button
      {...confirmation.buttonProps}
      priority="primary"
      onClick={onAutoAffectation}
      disabled={isAutoAffecting || !hasAnyNonAffectedFile}
      iconId={isAutoAffecting ? undefined : 'fr-icon-sparkling-2-line'}
      title={hasAnyNonAffectedFile ? undefined : 'Tous les dossiers ont des rapporteurs attribués'}
    >
      {isAutoAffecting ? 'Affectation en cours...' : 'Attribuer les rapports'}
    </Button>
  );
}
