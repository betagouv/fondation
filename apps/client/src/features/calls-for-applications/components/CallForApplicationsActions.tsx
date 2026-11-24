import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmModal } from '@/shared/context/confirm-modal';
import { IconButton } from '@/shared/ui/icon-button';
import { ACTION_ICONS } from '@/shared/ui/icons';
import { useToasts } from '@/shared/ui/toast';
import { ValidationError } from '@/utils/validation-error';
import {
  type CallForApplications,
  useDeleteCallForApplicationsMutation,
} from '@queries/calls-for-applications.queries';

import { CallForApplicationsHistoryModal } from './CallForApplicationsHistoryModal';
import { CallForApplicationsModal } from './CallForApplicationsModal';

export function CallForApplicationsActions(props: { call: CallForApplications }) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { waitForConfirmation } = useConfirmModal();
  const remove = useDeleteCallForApplicationsMutation();
  // the modal outlives the closing, for it to fade out with its content
  const [editing, setEditing] = useState<{ open: boolean } | null>(null);
  const [showingHistory, setShowingHistory] = useState<{ open: boolean } | null>(null);

  const confirmDeletion = async () => {
    const { isConfirmed } = await waitForConfirmation({
      content: (
        <p className="fr-mb-0">
          <FormattedMessage defaultMessage="La suppression est définitive. L'appel à candidatures ne pourra pas être récupéré." />
        </p>
      ),
      i18n: { confirm: formatMessage({ defaultMessage: 'Supprimer' }) },
      title: formatMessage({ defaultMessage: "Supprimer l'appel à candidatures ?" }),
    });
    if (!isConfirmed) return;

    remove.mutate(props.call.id, {
      onError: (error) =>
        toasts.error({
          description:
            ValidationError.messageOf(error) ??
            formatMessage({ defaultMessage: 'Réessayez et prévenez le support si cela persiste.' }),
          title: formatMessage({ defaultMessage: "L'appel à candidatures n'a pas été supprimé" }),
        }),
      onSuccess: () =>
        toasts.success({ title: formatMessage({ defaultMessage: "L'appel à candidatures a été supprimé" }) }),
    });
  };

  return (
    <div className="flex gap-1">
      <IconButton
        iconId={ACTION_ICONS.history}
        label={formatMessage({ defaultMessage: "Voir l'historique de l'appel à candidatures" })}
        onClick={() => setShowingHistory({ open: true })}
        small
      />
      {props.call.canChange && (
        <>
          <IconButton
            iconId={ACTION_ICONS.edit}
            label={formatMessage({ defaultMessage: "Modifier l'appel à candidatures" })}
            onClick={() => setEditing({ open: true })}
            small
          />
          <IconButton
            disabled={remove.isPending}
            iconId={ACTION_ICONS.delete}
            label={formatMessage({ defaultMessage: "Supprimer l'appel à candidatures" })}
            onClick={() => void confirmDeletion()}
            small
          />
        </>
      )}
      {showingHistory && (
        <CallForApplicationsHistoryModal
          history={props.call.history}
          onClose={() => setShowingHistory({ open: false })}
          onClosed={() => setShowingHistory(null)}
          open={showingHistory.open}
        />
      )}
      {editing && (
        <CallForApplicationsModal
          edited={props.call}
          onClose={() => setEditing({ open: false })}
          onClosed={() => setEditing(null)}
          open={editing.open}
        />
      )}
    </div>
  );
}
