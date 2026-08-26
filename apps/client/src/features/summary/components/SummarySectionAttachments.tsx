import Button from '@codegouvfr/react-dsfr/Button';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { useCallback, useRef, type ChangeEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { useOpenSummaryAttachment } from '@/features/summary/hooks/useOpenSummaryAttachment';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useAttachSummaryFilesMutation, useDetachSummaryFilesMutation } from '@queries/summary.queries';

import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionAttachments() {
  const { summary, canWriteSummary } = useSummary();

  const attachmentsCount = summary.summary.attachments.length;

  return (
    <SummarySectionCard id="pieces-jointes">
      <h2>
        <FormattedMessage
          defaultMessage="{count, plural, one {Pièce jointe} other {Pièces jointes ({count})}}"
          values={{ count: attachmentsCount }}
        />
      </h2>

      <SummaryAttachmentInput />

      <div className="fr-mt-4v">
        {attachmentsCount ? (
          <ul>
            {summary.summary.attachments.map(({ id, name }) => (
              <SummaryAttachment fileId={id} key={id} name={name} />
            ))}
          </ul>
        ) : canWriteSummary ? null : (
          <p className="text-sm text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Aucune pièce jointe pour le moment" />
          </p>
        )}
      </div>
    </SummarySectionCard>
  );
}

function SummaryAttachmentInput() {
  const { sessionId, nominationFileId, canWriteSummary, summary } = useSummary();
  const { formatMessage } = useIntl();
  const { mutate, isPending } = useAttachSummaryFilesMutation();
  const ref = useRef<HTMLInputElement | null>(null);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();

      const files = e.target.files;
      if (!files || files.length === 0) return;

      mutate(
        { files: [...files], sessionId, nominationFileId },
        {
          onSettled() {
            if (ref.current) ref.current.value = null as unknown as string;
          },
        },
      );
    },
    [mutate, sessionId, nominationFileId, ref],
  );

  if (!canWriteSummary) return null;

  return (
    <Upload
      disabled={isPending || summary.isArchived}
      hint={formatMessage({ defaultMessage: 'Tout type de fichier supporté' })}
      label={null}
      multiple
      nativeInputProps={{ ref, onChange }}
    />
  );
}

function SummaryAttachment(props: { fileId: string; name: string }) {
  const { canWriteSummary, nominationFileId, sessionId } = useSummary();
  const { formatMessage } = useIntl();

  const { isPending: isGenerating, open: openAttachment } = useOpenSummaryAttachment();
  const onOpenAttachment = useCallback(() => {
    openAttachment({ fileId: props.fileId, name: props.name, nominationFileId, sessionId });
  }, [nominationFileId, openAttachment, props.fileId, props.name, sessionId]);

  const { mutate: detach, isPending: detachingIsPending } = useDetachSummaryFilesMutation();
  const { waitForConfirmation } = useConfirmModal();
  const onDeleteAttachment = useCallback(async () => {
    const { isConfirmed } = await waitForConfirmation({
      content: formatMessage({
        defaultMessage: 'Une fois supprimé, il sera impossible de le récupérer.',
      }),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Supprimer le fichier' }),
      },
      title: formatMessage({ defaultMessage: 'Veuillez confirmer la suppression du fichier' }),
    });

    if (!isConfirmed) return;

    detach({ fileIds: [props.fileId], nominationFileId, sessionId });
  }, [detach, formatMessage, nominationFileId, props.fileId, sessionId, waitForConfirmation]);

  return (
    <li className="flex">
      <Button
        className="text-ellipsis"
        disabled={isGenerating}
        iconId="ri-file-text-line"
        onClick={onOpenAttachment}
        priority="tertiary no outline"
      >
        {props.name}
      </Button>
      {canWriteSummary ? (
        <Button
          disabled={detachingIsPending}
          iconId="fr-icon-delete-bin-fill"
          onClick={onDeleteAttachment}
          priority="tertiary no outline"
          title={formatMessage({ defaultMessage: 'Supprimer le fichier' })}
        />
      ) : null}
    </li>
  );
}
