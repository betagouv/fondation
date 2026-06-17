import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useTab } from '@/hooks/useTab';
import type { FoundSessionDocsDto } from '@api/types';
import {
  useDetailsSessionAgendaMutation,
  useDetailsSessionOfficialReportsMutation,
} from '@queries/agenda.queries';

export function DocActionDetails(props: {
  sessionId: string;
  doc: FoundSessionDocsDto['items'][number];
  disabled: boolean;
  setIsActing: (acting: boolean) => void;
}) {
  const { disabled, doc, sessionId, setIsActing } = props;

  const tab = useTab();
  const { mutate: openAgenda, isPending: isOpeningAgenda } = useDetailsSessionAgendaMutation();
  const { mutate: openOfficialReport, isPending: isOpeningOfficialReport } =
    useDetailsSessionOfficialReportsMutation();

  const onSuccess = React.useCallback((x: { url: string }) => tab.open(x.url), [tab]);
  const onSettled = React.useCallback(() => setIsActing(false), [setIsActing]);

  const onClick = React.useCallback(() => {
    setIsActing(true);
    return doc.type === 'agenda'
      ? openAgenda({ sessionId, agendaId: doc.id }, { onSuccess, onSettled })
      : openOfficialReport({ sessionId, officialReportId: doc.id }, { onSuccess, onSettled });
  }, [sessionId, doc, setIsActing, onSuccess, onSettled, openAgenda, openOfficialReport]);

  return (
    <Button
      size="small"
      priority="tertiary no outline"
      className="grow truncate text-left"
      disabled={isOpeningAgenda || isOpeningOfficialReport || disabled}
      onClick={onClick}
    >
      <>
        {doc.type === 'agenda' && !doc.isLinkedToOfficialReport && (
          <Badge as="span" small noIcon severity="error" className="fr-mr-1v rounded-full">
            <FormattedMessage defaultMessage={'pv attendu'} />
          </Badge>
        )}
        {doc.name}
      </>
    </Button>
  );
}
