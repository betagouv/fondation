import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { useTab } from '@/shared/hooks/useTab';
import { useToasts } from '@/shared/ui/toast';
import { useGenerateSummaryAttachmentPublicUrlMutation } from '@queries/summary.queries';

export function useOpenSummaryAttachment() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const tab = useTab();
  const { mutateAsync, isPending } = useGenerateSummaryAttachmentPublicUrlMutation();

  const open = useCallback(
    async (attachment: { fileId: string; name: string; nominationFileId: string; sessionId: string }) => {
      const attachmentTab = tab.openDeferred({
        message: formatMessage({ defaultMessage: 'Ouverture de la pièce jointe, merci de patienter...' }),
        title: attachment.name,
      });

      try {
        const url = await mutateAsync(attachment);
        if (!url) throw new Error(`no public url for ${attachment.name}`);

        attachmentTab.settle(url);
      } catch {
        attachmentTab.cancel();
        toasts.error({
          description: formatMessage({
            defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
          }),
          title: formatMessage(
            { defaultMessage: 'L\'ouverture de "{name}" a échoué' },
            { name: attachment.name },
          ),
        });
      }
    },
    [formatMessage, mutateAsync, tab, toasts],
  );

  return { isPending, open };
}
