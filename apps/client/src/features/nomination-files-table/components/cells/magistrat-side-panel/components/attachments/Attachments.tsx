import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { useConfirmation } from '@/shared/context/confirmation';
import { useTab } from '@/shared/hooks/useTab';
import type { NominationFileAttachmentTypeEnum } from '@/types/enums.types';
import { formatFileSize, splitFileName } from '@/utils/file.utils';
import {
  useCreateNominationFileAttachmentUrlMutation,
  useListNominationFileAttachmentsQuery,
  useRemoveNominationFileAttachmentMutation,
} from '@queries/nomination-sessions.queries';

import { useAddNominationFileAttachmentModal } from './context/AddNominationFileAttachmentModalContext';
import { NominationFileAttachmentTypeTag } from './NominationFileAttachmentTypeTag';

export const ATTACHMENTS_SECTION_ID = 'magistrat-attachments-section';

export function Attachments(props: { nominationFileId: string; sessionId: string; isArchived: boolean }) {
  const isSg = useIsSgNavigation();
  const { open: openAddAttachment } = useAddNominationFileAttachmentModal();
  const { data } = useListNominationFileAttachmentsQuery({
    nominationFileId: props.nominationFileId,
    sessionId: props.sessionId,
  });

  const attachments = data?.items ?? [];
  const canManage = isSg && !props.isArchived;
  const labelId = `attachments-${props.nominationFileId}`;

  if (attachments.length === 0 && !canManage) return null;

  return (
    <div id={ATTACHMENTS_SECTION_ID}>
      <div className="fr-mb-4v flex items-center justify-between gap-4">
        <p className="fr-mb-0 text-xl font-semibold" id={labelId}>
          <FormattedMessage
            defaultMessage="{count, plural, one {Pièce jointe} other {Pièces jointes ({count})}}"
            values={{ count: attachments.length }}
          />
        </p>
        {canManage && (
          <Button
            onClick={() =>
              openAddAttachment({
                nominationFileId: props.nominationFileId,
                sessionId: props.sessionId,
              })
            }
            priority="secondary"
            size="small"
          >
            <FormattedMessage defaultMessage="Ajouter" />
          </Button>
        )}
      </div>

      {attachments.length > 0 ? (
        <ul
          aria-labelledby={labelId}
          className="fr-m-0 fr-p-0 list-none divide-y divide-(--border-default-grey) border-y border-(--border-default-grey)"
        >
          {attachments.map((file) => (
            <AttachmentItem
              key={file.id}
              addedAt={file.addedAt}
              canDelete={canManage}
              fileId={file.id}
              name={file.name}
              nominationFileId={props.nominationFileId}
              sessionId={props.sessionId}
              size={file.size}
              type={file.type}
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
    </div>
  );
}

function AttachmentItem(props: {
  fileId: string;
  nominationFileId: string;
  sessionId: string;
  addedAt: string;
  canDelete: boolean;
  name: string;
  size: number | null;
  type: NominationFileAttachmentTypeEnum;
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
    const attachmentTab = tab.openDeferred({
      message: formatMessage({ defaultMessage: 'Ouverture de la pièce jointe, merci de patienter...' }),
      title: props.name,
    });

    createUrl(
      { fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId },
      {
        onError: () => attachmentTab.cancel(),
        onSuccess: (response) => {
          if (response) attachmentTab.settle(response.url);
          else attachmentTab.cancel();
        },
      },
    );
  }, [createUrl, formatMessage, props.fileId, props.name, props.nominationFileId, props.sessionId, tab]);

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
      <div className="fr-mb-2v flex items-center gap-2">
        <NominationFileAttachmentTypeTag type={props.type} />
        <span className="text-sm text-(--text-mention-grey)">
          <FormattedMessage
            defaultMessage="Ajoutée le {date, date, dateOnlyShort}"
            values={{ date: new Date(props.addedAt) }}
          />
        </span>
      </div>

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
