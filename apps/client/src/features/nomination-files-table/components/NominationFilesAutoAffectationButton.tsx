import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { useNominationFilesTable } from '../context/files-table.context';
import { useAlerts } from '@/shared/context/alerts';
import { confirmationModal, useConfirmation } from '@/shared/context/confirmation';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useAutoAffectationMutation,
  useCountUnaffectedFilesQuery,
} from '@queries/nomination-sessions.queries';

import { MemberExclusionSelector } from './MemberExclusionSelector';

export function NominationFilesAutoAffectationButton() {
  const alerts = useAlerts();
  const confirmation = useConfirmation();
  const { formatMessage } = useIntl();
  const { canManage, formation, sessionId } = useNominationFilesTable();
  const { mutateAsync: autoAffectation, isPending: isAutoAffecting } = useAutoAffectationMutation();
  const excludedMemberIdsRef = useRef<string[]>([]);

  const { data, isFetching } = useCountUnaffectedFilesQuery({ enabled: canManage, sessionId });

  const unaffectedFilesCount = data?.count ?? 0;

  const onAutoAffectation = useCallback(async () => {
    if (isFetching || !unaffectedFilesCount) {
      return;
    }

    excludedMemberIdsRef.current = [];

    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: formatMessage({ defaultMessage: 'Affectation automatique' }),
      i18n: { confirm: formatMessage({ defaultMessage: 'Affecter automatiquement' }) },
      content: (
        <>
          <p>
            <FormattedMessage
              defaultMessage={
                `Vous allez affecter automatiquement <bold>{count, plural, one {# dossier} other {# dossiers}}</bold>, ` +
                `actuellement sans affectation.`
              }
              values={{
                bold: (x) => <strong className="font-bold">{x}</strong>,
                count: unaffectedFilesCount,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              defaultMessage={
                `L'affectation automatique prend en compte un plan de charge sur la session, ainsi que les ` +
                `incompatibilités de juridictions configurées dans <link>"Gérer les membres"</link>`
              }
              values={{
                link: (x) => (
                  <Link onClick={() => confirmationModal.close()} to={ROUTE_PATHS.SG.MANAGE_MEMBERS}>
                    {x}
                  </Link>
                ),
              }}
            />
          </p>
          <p>
            <FormattedMessage
              defaultMessage={
                `Une fois l'affectation faite, vous aurez toujours la possibilité de la modifier avant de la ` +
                `publier aux membres.`
              }
            />
          </p>
          <MemberExclusionSelector excludedMemberIdsRef={excludedMemberIdsRef} formation={formation} />
        </>
      ),
    });

    if (!isConfirmed) return;

    await autoAffectation(
      {
        sessionId,
        excludedMemberIds: excludedMemberIdsRef.current.length ? excludedMemberIdsRef.current : undefined,
      },
      {
        onError: () => {
          alerts.pushAlert({
            severity: 'error',
            title: formatMessage({
              defaultMessage: `Erreur lors de l'attribution automatique des rapports.`,
            }),
          });
        },
      },
    );
  }, [
    alerts,
    autoAffectation,
    confirmation,
    formatMessage,
    formation,
    isFetching,
    sessionId,
    unaffectedFilesCount,
  ]);

  if (!canManage) return null;

  return (
    <Button
      {...confirmation.buttonProps}
      className="py-2!"
      disabled={isAutoAffecting || !unaffectedFilesCount}
      iconId={isAutoAffecting ? undefined : 'fr-icon-sparkling-2-line'}
      onClick={onAutoAffectation}
      priority="secondary"
      size="small"
      title={
        unaffectedFilesCount
          ? undefined
          : formatMessage({ defaultMessage: 'Tous les dossiers ont des rapporteurs attribués' })
      }
    >
      {isAutoAffecting
        ? formatMessage({ defaultMessage: 'En cours...' })
        : formatMessage({ defaultMessage: 'Attribuer les rapports' })}
    </Button>
  );
}
