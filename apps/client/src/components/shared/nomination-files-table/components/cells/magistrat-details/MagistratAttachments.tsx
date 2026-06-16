import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { useCallback, useRef, type ChangeEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useIsSgNavigation } from '@/hooks/roles.hook';
import { useTab } from '@/hooks/useTab';
import {
  useAddNominationFileAttachmentsMutation,
  useCreateNominationFileAttachmentUrlMutation,
  useListNominationFileAttachmentsQuery,
  useRemoveNominationFileAttachmentMutation,
} from '@queries/nomination-sessions.queries';

export function MagistratAttachments(props: {
  nominationFileId: string;
  sessionId: string;
  isArchived: boolean;
}) {
  const { formatMessage } = useIntl();
  const isSg = useIsSgNavigation();
  const { data } = useListNominationFileAttachmentsQuery({
    nominationFileId: props.nominationFileId,
    sessionId: props.sessionId,
  });

  const attachments = data?.items ?? [];
  const canManage = isSg && !props.isArchived;
  const labelId = `attachments-${props.nominationFileId}`;

  const {
    mutate: add,
    isPending: isAddPending,
    isError: isAddError,
    reset: resetAdd,
  } = useAddNominationFileAttachmentsMutation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onAdd = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      add(
        { nominationFileId: props.nominationFileId, sessionId: props.sessionId, files: [...files] },
        {
          onSettled() {
            if (inputRef.current) inputRef.current.value = '';
          },
        },
      );
    },
    [add, props.sessionId, props.nominationFileId],
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xl font-semibold" id={labelId}>
          <FormattedMessage
            defaultMessage="{count, plural, =0 {Pièce jointe} one {Pièce jointe (#)} other {Pièces jointes (#)}}"
            values={{ count: attachments.length }}
          />
        </p>
      </div>

      {canManage && (
        <Upload
          className="mb-2"
          multiple
          disabled={isAddPending}
          hint={null}
          label={formatMessage({ defaultMessage: 'Ajouter une pièce jointe' })}
          nativeInputProps={{ ref: inputRef, onChange: onAdd }}
        />
      )}

      {attachments.length > 0 ? (
        <ul aria-labelledby={labelId} className="m-0 flex flex-col gap-2 p-0">
          {attachments.map((file) => (
            <AttachmentItem
              key={file.id}
              fileId={file.id}
              nominationFileId={props.nominationFileId}
              sessionId={props.sessionId}
              canDelete={canManage}
              name={file.name}
            />
          ))}
        </ul>
      ) : (
        !canManage && (
          <div aria-labelledby={labelId} className="w-full leading-7">
            <FormattedMessage defaultMessage="Aucune pièce jointe" />
          </div>
        )
      )}

      {isAddError && (
        <Alert
          className="mt-2"
          closable
          description={formatMessage({
            defaultMessage: "L'ajout de la pièce jointe a échoué. Veuillez réessayer.",
          })}
          onClose={resetAdd}
          severity="error"
          small
        />
      )}
    </div>
  );
}

function AttachmentItem(props: {
  fileId: string;
  nominationFileId: string;
  sessionId: string;
  canDelete: boolean;
  name: string;
}) {
  const { formatMessage } = useIntl();
  const tab = useTab();
  const {
    mutate: createUrl,
    isPending: isUrlPending,
    isError: isUrlError,
    reset: resetUrl,
  } = useCreateNominationFileAttachmentUrlMutation();
  const {
    mutate: remove,
    isPending: isRemovePending,
    isError: isRemoveError,
    reset: resetRemove,
  } = useRemoveNominationFileAttachmentMutation();

  const error = isUrlError
    ? formatMessage({ defaultMessage: 'Le téléchargement du fichier a échoué. Veuillez réessayer.' })
    : isRemoveError
      ? formatMessage({ defaultMessage: 'La suppression du fichier a échoué. Veuillez réessayer.' })
      : null;

  const onDownload = useCallback(() => {
    createUrl(
      { fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId },
      {
        onSuccess: (response) => {
          if (response) tab.open(response.url);
        },
      },
    );
  }, [createUrl, tab, props.sessionId, props.nominationFileId, props.fileId]);

  const onDelete = useCallback(() => {
    remove({ fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId });
  }, [remove, props.sessionId, props.nominationFileId, props.fileId]);

  return (
    <li className="flex flex-col gap-1 pb-0">
      <div className="flex items-center gap-4">
        <Button
          className="inline truncate"
          disabled={isUrlPending || isRemovePending}
          onClick={onDownload}
          priority="tertiary no outline"
        >
          {props.name}
        </Button>

        {props.canDelete && (
          <Button
            className="rounded-full"
            disabled={isRemovePending}
            iconId="fr-icon-delete-bin-fill"
            onClick={onDelete}
            priority="tertiary no outline"
            size="small"
            title={formatMessage({ defaultMessage: 'Supprimer {name}' }, { name: props.name })}
          />
        )}
      </div>

      {error && (
        <Alert
          closable
          description={error}
          onClose={() => {
            resetUrl();
            resetRemove();
          }}
          severity="error"
          small
        />
      )}
    </li>
  );
}
