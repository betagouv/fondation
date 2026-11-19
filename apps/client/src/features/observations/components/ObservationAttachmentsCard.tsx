import { FormattedMessage } from 'react-intl';

import { useObservationFileActions } from '@/features/observations/hooks/useObservationFileActions';
import { FileList, FileListItem } from '@/shared/components/file-list';
import { DetailsCard } from '@/shared/ui/details';
import { AttachmentFormatsHint, Upload } from '@/shared/ui/upload';
import { ATTACHMENT_FILE_TYPES } from '@/shared/ui/upload/file-types';
import type { GetObservationDetailsResponseDto } from '@api/types';

export function ObservationAttachmentsCard(props: {
  nominationFileId: string;
  observation: GetObservationDetailsResponseDto;
  onDownloadFile: (file: { id: string; name: string }) => void;
  onOpenFile: (file: { id: string; name: string }) => void;
  sessionId: string;
}) {
  const { canEdit, canManageAttachments, files } = props.observation;
  const { attach, detach, isPending, renaming } = useObservationFileActions({
    description: props.observation.description,
    id: props.observation.id,
    magistratId: props.observation.observant.id,
    nominationFileId: props.nominationFileId,
    receptionDate: props.observation.receptionDate,
    sessionId: props.sessionId,
  });

  return (
    <DetailsCard>
      {renaming.modal}
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
              onDelete={canManageAttachments ? () => detach(file) : undefined}
              onDownload={() => props.onDownloadFile(file)}
              onOpen={() => props.onOpenFile(file)}
              onRename={canManageAttachments ? () => renaming.open(file) : undefined}
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
            accept={ATTACHMENT_FILE_TYPES}
            clearOnChange
            hint={<AttachmentFormatsHint />}
            isPending={isPending}
            multiple
            onChange={(added) => added.length > 0 && attach(added)}
          />
        </div>
      )}
    </DetailsCard>
  );
}
