import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ACTION_ICONS } from '@/constants/icons.constants';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { IconButton } from '@/shared/ui/icon-button';
import { useToasts } from '@/shared/ui/toast';
import type { FoundSessionDocsDto } from '@api/types';
import { useDeleteAgenda, useDeleteOfficialReportMutation } from '@queries/agenda.queries';

export function DocActionDelete(props: {
  disabled: boolean;
  doc: FoundSessionDocsDto['items'][number];
  sessionId: string;
}) {
  const { doc, disabled, sessionId } = props;

  const { formatMessage } = useIntl();
  const confirmation = useConfirmModal();
  const toasts = useToasts();
  const { mutate: deleteAgenda, isPending: isDeletingAgenda } = useDeleteAgenda(sessionId);
  const { mutate: deleteOfficialReport, isPending: isDeletingOfficialReport } =
    useDeleteOfficialReportMutation(sessionId);

  const onDeleteDoc = useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: formatMessage({ defaultMessage: 'Confirmer la suppression de "{name}"' }, { name: doc.name }),
      content: (
        <>
          <p>
            <FormattedMessage
              defaultMessage='Voulez-vous vraiment supprimer le document "{name}"&nbsp;?'
              values={{ name: doc.name }}
            />
          </p>
          {doc.type === 'agenda' && doc.isLinkedToOfficialReport && (
            <p className="font-bold">
              <FormattedMessage defaultMessage="Cela entraînera la suppression du PV lié." />
            </p>
          )}
        </>
      ),
    });

    if (!isConfirmed) {
      return;
    }

    const onError = () =>
      toasts.error({
        description: formatMessage({
          defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
        }),
        title: formatMessage({ defaultMessage: 'La suppression de "{name}" a échoué' }, { name: doc.name }),
      });

    return doc.type === 'agenda'
      ? deleteAgenda({ agendaId: doc.id }, { onError })
      : deleteOfficialReport({ officialReportId: doc.id }, { onError });
  }, [confirmation, doc, deleteAgenda, deleteOfficialReport, formatMessage, toasts]);

  return (
    <IconButton
      disabled={isDeletingAgenda || isDeletingOfficialReport || disabled}
      iconId={ACTION_ICONS.delete}
      label={formatMessage({ defaultMessage: 'Supprimer {name}' }, { name: doc.name })}
      onClick={onDeleteDoc}
      small
    />
  );
}
