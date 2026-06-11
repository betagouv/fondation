import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useIsSgNavigation } from '@/hooks/roles.hook';
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

        {canManage && (
          <>
            <Button
              disabled={isAddPending}
              iconId="fr-icon-add-line"
              onClick={() => inputRef.current?.click()}
              priority="tertiary no outline"
              size="small"
              title={formatMessage({ defaultMessage: 'Ajouter une pièce jointe' })}
            >
              <FormattedMessage defaultMessage="Ajouter" />
            </Button>
            <input
              aria-hidden
              className="hidden"
              multiple
              onChange={onAdd}
              ref={inputRef}
              tabIndex={-1}
              type="file"
            />
          </>
        )}
      </div>

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
        <div aria-labelledby={labelId} className="w-full leading-7">
          <FormattedMessage defaultMessage="Aucune pièce jointe" />
        </div>
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
  const { mutate: createUrl, isPending: isUrlPending } = useCreateNominationFileAttachmentUrlMutation();
  const { mutate: remove, isPending: isRemovePending } = useRemoveNominationFileAttachmentMutation();
  const [error, setError] = useState<string | null>(null);

  const onDownload = useCallback(() => {
    setError(null);
    const downloadError = formatMessage({
      defaultMessage: 'Le téléchargement du fichier a échoué. Veuillez réessayer.',
    });
    createUrl(
      { fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId },
      {
        onSuccess: (response) => {
          if (!response) {
            setError(downloadError);
            return;
          }

          const a = document.createElement('a');
          a.href = response.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          a.remove();
        },
        onError: () => setError(downloadError),
      },
    );
  }, [createUrl, props.sessionId, props.nominationFileId, props.fileId, formatMessage]);

  const onDelete = useCallback(() => {
    setError(null);
    remove(
      { fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId },
      {
        onError: () =>
          setError(
            formatMessage({ defaultMessage: 'La suppression du fichier a échoué. Veuillez réessayer.' }),
          ),
      },
    );
  }, [remove, props.sessionId, props.nominationFileId, props.fileId, formatMessage]);

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

      {error && <Alert closable description={error} onClose={() => setError(null)} severity="error" small />}
    </li>
  );
}
