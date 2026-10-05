import { FormattedMessage, useIntl } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { DetailsCard } from '@/shared/ui/details';
import { FileList, FileListItem } from '@/shared/ui/file-list';
import { Upload } from '@/shared/ui/upload';
import { DOCUMENT_FILE_TYPES } from '@/shared/ui/upload/file-types';
import { dateOnlyToIso } from '@/utils/date-only.util';
import type { GetObservationDetailsResponseDto } from '@api/types';
import { useUpdateObservationMutation } from '@queries/observations.queries';

export function ObservationAttachmentsCard(props: {
  isArchived: boolean;
  nominationFileId: string;
  observation: GetObservationDetailsResponseDto;
  onDownloadFile: (file: { id: string; name: string }) => void;
  onOpenFile: (fileId: string) => void;
  sessionId: string;
}) {
  const { formatMessage } = useIntl();
  const isSg = useIsSg();
  const { waitForConfirmation } = useConfirmModal();
  const { isPending, mutate } = useUpdateObservationMutation();

  const { files } = props.observation;
  const canEdit = isSg && !props.isArchived;

  // the update endpoint rewrites the whole form: omitting the description would erase it
  const update = (changes: { detachFileIds?: string[]; files?: File[] }) =>
    mutate({
      ...changes,
      dateReception: dateOnlyToIso(props.observation.receptionDate),
      description: props.observation.description,
      linkedObservationsAttachments: [],
      magistratId: props.observation.observant.id,
      nominationFileId: props.nominationFileId,
      observationId: props.observation.id,
      sessionId: props.sessionId,
    });

  const onDelete = async (fileId: string) => {
    const { isConfirmed } = await waitForConfirmation({
      content: formatMessage({ defaultMessage: 'Une fois supprimé, il sera impossible de le récupérer.' }),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Supprimer le fichier' }),
      },
      title: formatMessage({ defaultMessage: 'Veuillez confirmer la suppression du fichier' }),
    });

    if (isConfirmed) update({ detachFileIds: [fileId] });
  };

  return (
    <DetailsCard>
      <h2 className="fr-h4" id="observation-files-title">
        <FormattedMessage
          defaultMessage="{count, plural, one {Pièce jointe} other {Pièces jointes ({count})}}"
          values={{ count: files.length }}
        />
      </h2>

      {files.length > 0 ? (
        <FileList aria-labelledby="observation-files-title">
          {files.map((file) => (
            <FileListItem
              addedAt={file.addedAt}
              addedBy={file.addedBy}
              disabled={isPending}
              key={file.id}
              name={file.name}
              onDelete={canEdit ? () => onDelete(file.id) : undefined}
              onDownload={() => props.onDownloadFile(file)}
              onOpen={() => props.onOpenFile(file.id)}
              size={file.size}
            />
          ))}
        </FileList>
      ) : canEdit ? null : (
        <p className="fr-mb-0 text-sm text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Aucune pièce jointe" />
        </p>
      )}

      {canEdit && (
        <div className={files.length > 0 ? 'fr-mt-6v' : undefined}>
          <Upload
            accept={DOCUMENT_FILE_TYPES}
            clearOnChange
            hint={<FormattedMessage defaultMessage="Formats supportés : png, jpeg, pdf, doc et docx" />}
            isPending={isPending}
            label={<FormattedMessage defaultMessage="Ajouter un fichier" />}
            multiple
            onChange={(added) => added.length > 0 && update({ files: added })}
          />
        </div>
      )}
    </DetailsCard>
  );
}
