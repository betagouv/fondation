import Button from '@codegouvfr/react-dsfr/Button';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import React from 'react';

import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { useSummary } from '@/pages/summary/SummaryContext';
import {
  useAttachSummaryFilesMutation,
  useDetachSummaryFilesMutation,
  useGenerateSummaryAttachmentPublicUrlMutation
} from '@queries/summary.queries';
import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionAttachments() {
  const { summary } = useSummary();

  const attachmentsCount = summary.summary.attachments.length;

  return (
    <SummarySectionCard id="pieces-jointes">
      <h2>Pièces jointes {attachmentsCount ? <span>({attachmentsCount})</span> : null}</h2>

      <SummaryAttachmentInput />

      {attachmentsCount ? (
        <ul>
          {summary.summary.attachments.map(({ id, name }) => (
            <SummaryAttachment key={id} fileId={id} name={name} />
          ))}
        </ul>
      ) : null}
    </SummarySectionCard>
  );
}

function SummaryAttachmentInput() {
  const { sessionId, nominationFileId } = useSummary();
  const { mutate, isPending } = useAttachSummaryFilesMutation();
  const ref = React.useRef<HTMLInputElement | null>(null);

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      mutate(
        { files: [...files], sessionId, nominationFileId },
        {
          onSettled() {
            if (ref.current) ref.current.files = null;
          }
        }
      );
    },
    [mutate, sessionId, nominationFileId, ref]
  );

  return (
    <Upload
      label={null}
      multiple
      hint="Tout type de fichier supporté"
      disabled={isPending}
      nativeInputProps={{ ref, onChange }}
    />
  );
}

function SummaryAttachment(props: { fileId: string; name: string }) {
  const { sessionId, nominationFileId } = useSummary();

  const { mutate: openAttachment, isPending: isGenerating } = useGenerateSummaryAttachmentPublicUrlMutation();
  const onOpenAttachment = React.useCallback(() => {
    openAttachment({ sessionId, nominationFileId, fileId: props.fileId });
  }, [openAttachment, sessionId, nominationFileId, props.fileId]);

  const { mutateAsync: detach, isPending: detachingIsPending } = useDetachSummaryFilesMutation();
  const { buttonProps, waitForConfirmation } = useConfirmation();
  const onDeleteAttachment = React.useCallback(async () => {
    const confirmed = await waitForConfirmation({
      title: `Veuillez confirmer la suppression du fichier`,
      content: `Une fois supprimé, il sera impossible de le récupérer.`,
      i18n: {
        cancel: 'Annuler',
        confirm: 'Supprimer le fichier'
      }
    });

    if (!confirmed) return;

    await detach({ sessionId, nominationFileId, fileIds: [props.fileId] });
  }, [sessionId, nominationFileId, detach, props.fileId, waitForConfirmation]);

  return (
    <li className="flex">
      <Button
        priority="tertiary no outline"
        className="text-ellipsis"
        disabled={isGenerating}
        onClick={onOpenAttachment}
      >
        {props.name}
      </Button>
      <Button
        disabled={detachingIsPending}
        title="Supprimer le fichier"
        priority="tertiary no outline"
        iconId="fr-icon-delete-bin-fill"
        nativeButtonProps={buttonProps}
        onClick={onDeleteAttachment}
      />
    </li>
  );
}
