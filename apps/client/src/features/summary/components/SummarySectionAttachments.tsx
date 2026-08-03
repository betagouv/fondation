import Button from '@codegouvfr/react-dsfr/Button';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { useConfirmation } from '@/shared/context/confirmation';
import {
  useAttachSummaryFilesMutation,
  useDetachSummaryFilesMutation,
  useGenerateSummaryAttachmentPublicUrlMutation,
} from '@queries/summary.queries';

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
              <SummaryAttachment key={id} fileId={id} name={name} />
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
  const ref = React.useRef<HTMLInputElement | null>(null);

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
      label={null}
      multiple
      hint={formatMessage({ defaultMessage: 'Tout type de fichier supporté' })}
      disabled={isPending || summary.isArchived}
      nativeInputProps={{ ref, onChange }}
    />
  );
}

function SummaryAttachment(props: { fileId: string; name: string }) {
  const { canWriteSummary, sessionId, nominationFileId } = useSummary();
  const { formatMessage } = useIntl();

  const { mutate: openAttachment, isPending: isGenerating } = useGenerateSummaryAttachmentPublicUrlMutation();
  const onOpenAttachment = React.useCallback(() => {
    openAttachment({ sessionId, nominationFileId, fileId: props.fileId });
  }, [openAttachment, sessionId, nominationFileId, props.fileId]);

  const { mutateAsync: detach, isPending: detachingIsPending } = useDetachSummaryFilesMutation();
  const { buttonProps, waitForConfirmation } = useConfirmation();
  const onDeleteAttachment = React.useCallback(async () => {
    const { isConfirmed } = await waitForConfirmation({
      title: formatMessage({ defaultMessage: 'Veuillez confirmer la suppression du fichier' }),
      content: formatMessage({ defaultMessage: 'Une fois supprimé, il sera impossible de le récupérer.' }),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Supprimer le fichier' }),
      },
    });

    if (!isConfirmed) return;

    await detach({ sessionId, nominationFileId, fileIds: [props.fileId] });
  }, [sessionId, nominationFileId, detach, formatMessage, props.fileId, waitForConfirmation]);

  return (
    <li className="flex">
      <Button
        priority="tertiary no outline"
        className="text-ellipsis"
        disabled={isGenerating}
        onClick={onOpenAttachment}
        iconId="ri-file-text-line"
      >
        {props.name}
      </Button>
      {canWriteSummary ? (
        <Button
          disabled={detachingIsPending}
          title={formatMessage({ defaultMessage: 'Supprimer le fichier' })}
          priority="tertiary no outline"
          iconId="fr-icon-delete-bin-fill"
          nativeButtonProps={buttonProps}
          onClick={onDeleteAttachment}
        />
      ) : null}
    </li>
  );
}
