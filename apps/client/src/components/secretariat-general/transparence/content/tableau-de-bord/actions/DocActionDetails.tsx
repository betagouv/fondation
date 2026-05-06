import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';

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
      className="flex-grow truncate text-left"
      disabled={isOpeningAgenda || isOpeningOfficialReport || disabled}
      onClick={onClick}
    >
      {doc.name}
    </Button>
  );
}
