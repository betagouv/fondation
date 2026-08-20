import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { useAlerts } from '@/shared/context/alerts';
import { useTab } from '@/shared/hooks/useTab';
import type { FoundSessionDocsDto } from '@api/types';
import {
  useDetailsSessionAgendaMutation,
  useDetailsSessionOfficialReportsMutation,
} from '@queries/agenda.queries';

export function DocActionDetails(props: {
  disabled: boolean;
  doc: FoundSessionDocsDto['items'][number];
  sessionId: string;
  setIsActing: (acting: boolean) => void;
}) {
  const { disabled, doc, sessionId, setIsActing } = props;

  const { formatMessage } = useIntl();
  const alerts = useAlerts();
  const tab = useTab();
  const { mutateAsync: openAgenda, isPending: isOpeningAgenda } = useDetailsSessionAgendaMutation();
  const { mutateAsync: openOfficialReport, isPending: isOpeningOfficialReport } =
    useDetailsSessionOfficialReportsMutation();

  const onSettled = useCallback(() => setIsActing(false), [setIsActing]);
  const onFailure = useCallback(
    () =>
      alerts.pushAlert({
        severity: 'error',
        title: formatMessage({
          defaultMessage: `Le document n'a pas pu être ouvert`,
        }),
        description: formatMessage({
          defaultMessage: 'Sa génération a échoué. Réessayez et prévenez le support si cela persiste.',
        }),
      }),
    [alerts, formatMessage],
  );

  const onClick = useCallback(() => {
    const documentTab = tab.openDeferred();
    setIsActing(true);

    const details =
      doc.type === 'agenda'
        ? openAgenda({ sessionId, agendaId: doc.id })
        : openOfficialReport({ sessionId, officialReportId: doc.id });

    return details
      .then(({ url }) => documentTab.settle(url))
      .catch(() => {
        documentTab.cancel();
        onFailure();
      })
      .finally(onSettled);
  }, [sessionId, doc, setIsActing, onFailure, onSettled, openAgenda, openOfficialReport, tab]);

  return (
    <Button
      className="fr-btn--align-on-content grow truncate text-left"
      disabled={isOpeningAgenda || isOpeningOfficialReport || disabled}
      onClick={onClick}
      priority="tertiary no outline"
      size="small"
    >
      {doc.name}
    </Button>
  );
}
