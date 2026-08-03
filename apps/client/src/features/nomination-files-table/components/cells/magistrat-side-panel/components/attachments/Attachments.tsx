import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { useCallback, useRef, type ChangeEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { useConfirmation } from '@/shared/context/confirmation';
import { useTab } from '@/shared/hooks/useTab';
import { formatFileSize, splitFileName } from '@/utils/file.utils';
import {
  useAddNominationFileAttachmentsMutation,
  useCreateNominationFileAttachmentUrlMutation,
  useListNominationFileAttachmentsQuery,
  useRemoveNominationFileAttachmentMutation,
} from '@queries/nomination-sessions.queries';

export function Attachments(props: { nominationFileId: string; sessionId: string; isArchived: boolean }) {
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

  if (attachments.length === 0 && !canManage) return null;

  return (
    <div>
      <p className="fr-mb-4v text-xl font-semibold" id={labelId}>
        <FormattedMessage
          defaultMessage="{count, plural, one {Pièce jointe} other {Pièces jointes ({count})}}"
          values={{ count: attachments.length }}
        />
      </p>

      {attachments.length > 0 ? (
        <ul
          aria-labelledby={labelId}
          className="fr-m-0 fr-p-0 list-none divide-y divide-(--border-default-grey) border-y border-(--border-default-grey)"
        >
          {attachments.map((file) => (
            <AttachmentItem
              key={file.id}
              canDelete={canManage}
              fileId={file.id}
              name={file.name}
              nominationFileId={props.nominationFileId}
              sessionId={props.sessionId}
              size={file.size}
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

      {canManage && (
        <div
          className="fr-mt-3v fr-p-4v max-w-105 cursor-pointer bg-(--background-alt-grey) [&_.fr-hint-text]:text-sm [&_.fr-hint-text]:font-normal [&_.fr-hint-text]:text-(--text-mention-grey) [&_.fr-label]:cursor-pointer [&_.fr-label]:text-base [&_.fr-label]:font-medium [&_.fr-label]:text-(--text-label-grey) [&_.fr-upload]:cursor-pointer"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('.fr-upload, .fr-label')) return;
            inputRef.current?.click();
          }}
        >
          <Upload
            disabled={isAddPending}
            hint={formatMessage({ defaultMessage: 'Formats supportés : PNG, JPG et PDF' })}
            label={formatMessage({ defaultMessage: 'Ajouter un fichier' })}
            multiple
            nativeInputProps={{
              accept: 'image/png,image/jpeg,application/pdf',
              onChange: onAdd,
              ref: inputRef,
            }}
          />
        </div>
      )}

      {isAddError && (
        <Alert
          className="fr-mt-2v"
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
  size: number | null;
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
  const { buttonProps, waitForConfirmation } = useConfirmation();

  const { label, extension } = splitFileName(props.name);
  const meta = [extension?.toUpperCase(), props.size != null ? formatFileSize(props.size) : null]
    .filter(Boolean)
    .join(' - ');

  const error = isUrlError
    ? formatMessage({ defaultMessage: 'Le téléchargement du fichier a échoué. Veuillez réessayer.' })
    : isRemoveError
      ? formatMessage({ defaultMessage: 'La suppression du fichier a échoué. Veuillez réessayer.' })
      : null;

  const onPreview = useCallback(() => {
    createUrl(
      { fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId },
      {
        onSuccess: (response) => {
          if (response) tab.open(response.url);
        },
      },
    );
  }, [createUrl, tab, props.sessionId, props.nominationFileId, props.fileId]);

  const onDownload = useCallback(() => {
    createUrl(
      { fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId },
      {
        onSuccess: (response) => {
          if (!response) return;
          const { pathname } = new URL(response.url);
          tab.download(`${pathname}?download`);
        },
      },
    );
  }, [createUrl, tab, props.sessionId, props.nominationFileId, props.fileId]);

  const onDelete = useCallback(async () => {
    const { isConfirmed } = await waitForConfirmation({
      title: formatMessage({ defaultMessage: 'Supprimer la pièce jointe' }),
      content: (
        <p>
          <FormattedMessage
            defaultMessage="Êtes-vous sûr de vouloir supprimer la pièce jointe <b>{name}</b> ?"
            values={{ b: (chunks) => <strong>{chunks}</strong>, name: props.name }}
          />
        </p>
      ),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Supprimer' }),
      },
    });
    if (!isConfirmed) return;
    remove({ fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId });
  }, [
    waitForConfirmation,
    remove,
    formatMessage,
    props.name,
    props.sessionId,
    props.nominationFileId,
    props.fileId,
  ]);

  return (
    <li className="fr-py-3v">
      <div className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 items-center gap-x-2" style={{ gridTemplateColumns: 'auto 1fr' }}>
          <span
            aria-hidden="true"
            className="fr-icon-file-line fr-icon--sm shrink-0 text-(--text-title-blue-france)"
            style={{ transform: 'translateY(1px)' }}
          />
          <button
            className="-mx-1 -my-0.5 truncate border-0 bg-transparent px-1 py-0.5 text-left text-(--text-action-high-blue-france) underline underline-offset-2 hover:bg-(--background-default-grey-hover) disabled:opacity-50"
            disabled={isUrlPending || isRemovePending}
            onClick={onPreview}
            title={formatMessage(
              { defaultMessage: 'Ouvrir {name} dans un nouvel onglet' },
              { name: props.name },
            )}
            type="button"
          >
            {label}
          </button>
          {meta && <span className="col-start-2 text-sm text-(--text-mention-grey)">{meta}</span>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            disabled={isUrlPending || isRemovePending}
            iconId="fr-icon-download-line"
            onClick={onDownload}
            priority="tertiary no outline"
            size="small"
            title={formatMessage({ defaultMessage: 'Télécharger {name}' }, { name: props.name })}
          />
          {props.canDelete && (
            <Button
              disabled={isRemovePending}
              iconId="fr-icon-delete-bin-line"
              nativeButtonProps={buttonProps}
              onClick={onDelete}
              priority="tertiary no outline"
              size="small"
              title={formatMessage({ defaultMessage: 'Supprimer {name}' }, { name: props.name })}
            />
          )}
        </div>
      </div>

      {error && (
        <Alert
          className="fr-mt-2v"
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
