import { useIntl } from 'react-intl';

import { useRenameAttachmentModal } from '@/shared/components/rename-attachment';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useAttachmentFailureToast } from '@/shared/hooks/useAttachmentFailureToast';
import { dateOnlyToIso, type PlainDateOnly } from '@/utils/date-only.util';
import {
  useRenameObservationFileMutation,
  useUpdateObservationMutation,
} from '@queries/observations.queries';

/** adds, detaches and renames the files of an observation, from its page as from the side panel */
export function useObservationFileActions(observation: {
  description: string | null;
  id: string;
  magistratId: string;
  nominationFileId: string;
  receptionDate: PlainDateOnly;
  sessionId: string;
}) {
  const { formatMessage } = useIntl();
  const { waitForConfirmation } = useConfirmModal();
  const notifyFailure = useAttachmentFailureToast();
  const { isPending, mutate } = useUpdateObservationMutation();
  const { mutateAsync: renameFile } = useRenameObservationFileMutation();

  // the update endpoint rewrites the whole form: omitting the description would erase it
  const update = (changes: { detachFileIds?: string[]; files?: File[] }, onError: (error: unknown) => void) =>
    mutate(
      {
        ...changes,
        dateReception: dateOnlyToIso(observation.receptionDate),
        description: observation.description,
        linkedObservationsAttachments: [],
        magistratId: observation.magistratId,
        nominationFileId: observation.nominationFileId,
        observationId: observation.id,
        sessionId: observation.sessionId,
      },
      { onError },
    );

  const attach = (files: File[]) =>
    update({ files }, (error) => notifyFailure('upload', files.map(({ name }) => name).join(', '), error));

  const detach = async (file: { id: string; name: string }) => {
    const { isConfirmed } = await waitForConfirmation({
      content: formatMessage({ defaultMessage: 'Une fois supprimé, il sera impossible de le récupérer.' }),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Supprimer le fichier' }),
      },
      title: formatMessage({ defaultMessage: 'Veuillez confirmer la suppression du fichier' }),
    });

    if (isConfirmed)
      update({ detachFileIds: [file.id] }, (error) => notifyFailure('delete', file.name, error));
  };

  const renaming = useRenameAttachmentModal((file: { id: string; name: string }, name) =>
    renameFile({
      fileId: file.id,
      name,
      nominationFileId: observation.nominationFileId,
      observationId: observation.id,
      sessionId: observation.sessionId,
    }),
  );

  return { attach, detach, isPending, renaming };
}
