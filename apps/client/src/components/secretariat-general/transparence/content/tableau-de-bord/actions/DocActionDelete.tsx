import { useConfirmation } from '@/hooks/useConfirmation.hook';
import type { FoundSessionDocsDto } from '@api/types';
import Button from '@codegouvfr/react-dsfr/Button';
import { useDeleteAgenda, useDeleteOfficialReportMutation } from '@queries/agenda.queries';
import React from 'react';

export function DocActionDelete(props: {
  disabled: boolean;
  sessionId: string;
  doc: FoundSessionDocsDto['items'][number];
}) {
  const { doc, disabled, sessionId } = props;

  const confirmation = useConfirmation();
  const { mutate: deleteAgenda, isPending: isDeletingAgenda } = useDeleteAgenda(sessionId);
  const { mutate: deleteOfficialReport, isPending: isDeletingOfficialReport } =
    useDeleteOfficialReportMutation(sessionId);

  const onDeleteDoc = React.useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: `Confirmer la suppression de "${doc.name}"`,
      content: (
        <>
          <p>Voulez-vous vraiment supprimer le document "{doc.name}"&nbsp;?</p>
          {doc.type === 'agenda' && doc.isLinkedToOfficialReport && (
            <p className="font-bold">Cela entraînera la suppression du PV lié.</p>
          )}
        </>
      )
    });

    if (!isConfirmed) {
      return;
    }

    return doc.type === 'agenda'
      ? deleteAgenda({ agendaId: doc.id })
      : deleteOfficialReport({ officialReportId: doc.id });
  }, [confirmation, doc, deleteAgenda, deleteOfficialReport]);

  return (
    <Button
      size="small"
      iconId="fr-icon-delete-bin-fill"
      priority="tertiary no outline"
      className="rounded-full"
      disabled={isDeletingAgenda || isDeletingOfficialReport || disabled}
      title={`Supprimer "${doc.name}"`}
      nativeButtonProps={confirmation.buttonProps}
      onClick={onDeleteDoc}
    />
  );
}
