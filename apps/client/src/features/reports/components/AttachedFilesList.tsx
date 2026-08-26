import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { useTab } from '@/shared/hooks/useTab';
import { DeleteFileButton } from '@/shared/ui/DeleteFileButton';
import { useToasts } from '@/shared/ui/toast';
import { useGenerateReportFilePublicUrlMutation } from '@queries/reports.queries';

export function AttachedFilesList(props: {
  attachments: { fileId: string; name: string }[];
  onDelete: (fileName: string) => unknown;
  reportId: string;
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const tab = useTab();

  const { isPending, mutateAsync: createAttachmentLink } = useGenerateReportFilePublicUrlMutation();

  const onOpen = useCallback(
    async (fileName: string) => {
      const attachmentTab = tab.openDeferred({
        message: formatMessage({ defaultMessage: 'Ouverture de la pièce jointe, merci de patienter...' }),
        title: fileName,
      });

      try {
        attachmentTab.settle(await createAttachmentLink({ fileName, reportId: props.reportId }));
      } catch {
        attachmentTab.cancel();
        toasts.error({
          description: formatMessage({
            defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
          }),
          title: formatMessage({ defaultMessage: 'L\'ouverture de "{name}" a échoué' }, { name: fileName }),
        });
      }
    },
    [createAttachmentLink, formatMessage, props.reportId, tab, toasts],
  );

  return (
    <ul className={clsx('flex flex-col gap-2')}>
      {props.attachments.map((file) => (
        <li key={file.fileId} className="flex items-center gap-4">
          <Button
            className="text-ellipsis"
            disabled={isPending}
            onClick={() => onOpen(file.name)}
            priority="tertiary no outline"
          >
            {file.name}
          </Button>

          <DeleteFileButton fileName={file.name} onDelete={() => props.onDelete(file.name)} />
        </li>
      ))}
    </ul>
  );
}
